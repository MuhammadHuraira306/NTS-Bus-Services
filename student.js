/**
 * NTS Travel Services - Student Portal Controller
 * Manages Polling, Live Bus Tracking, Arrival Alerts, and Boarding Confirmation
 */

import { storage } from './storage.js';
import { NTSAuth } from './auth.js';
import { NTSPollingManager } from './polling.js';
import { NTSTrackingManager } from './tracking.js';
import { NTSNotificationManager } from './notifications.js';
import { $, $$, showToast, escapeHtml } from './utils.js';

export class StudentPortalController {
  constructor() {
    this.currentUser = NTSAuth.getCurrentUser();
    this.currentTab = 'morning-poll';
    this.trackingInterval = null;
  }

  init() {
    // If not logged in, redirect
    if (!NTSAuth.checkRouteAccess('student')) return;

    this.renderHeaderInfo();
    this.setupEventListeners();
    this.renderActiveTab();
    this.startLiveSync();

    // Check notification permissions
    NTSNotificationManager.requestPermission();
  }

  renderHeaderInfo() {
    const nameEl = $('#user-display-name');
    const idEl = $('#user-display-id');
    if (nameEl) nameEl.textContent = this.currentUser.name;
    if (idEl) idEl.textContent = this.currentUser.universityId || this.currentUser.department;
  }

  setupEventListeners() {
    // Tab switching
    $$('.student-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Reactive data change listener (Local and Multi-tab sync)
    window.addEventListener('nts:data-changed', (e) => {
      this.handleExternalDataChange(e.detail);
    });

    // Logout
    const logoutBtn = $('#btn-student-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => NTSAuth.logout());
    }

    // Notifications toggle
    const notifBtn = $('#student-notif-btn');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        const drawer = $('#notif-drawer');
        if (drawer) {
          drawer.classList.toggle('active');
          if (drawer.classList.contains('active')) {
            NTSNotificationManager.markAllAsRead(this.currentUser.studentId);
            this.updateNotifBadge();
          }
        }
      });
    }

    const closeNotifBtn = $('#close-notif-drawer');
    if (closeNotifBtn) {
      closeNotifBtn.addEventListener('click', () => {
        $('#notif-drawer')?.classList.remove('active');
      });
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    $$('.student-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    this.renderActiveTab();
  }

  renderActiveTab() {
    this.updateNotifBadge();

    // Check if active boarding banner is needed (Bus is currently at student's stop)
    this.renderActiveBoardingPrompt();

    switch (this.currentTab) {
      case 'morning-poll':
        this.renderPollView('morning');
        break;
      case 'return-poll':
        this.renderPollView('return');
        break;
      case 'track-bus':
        this.renderTrackingView();
        break;
      case 'journey-history':
        this.renderHistoryView();
        break;
      default:
        this.renderPollView('morning');
    }
  }

  updateNotifBadge() {
    const badge = $('#notif-unread-badge');
    const listEl = $('#notif-items-list');
    const count = NTSNotificationManager.getUnreadCount(this.currentUser.studentId);
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
    if (listEl) {
      NTSNotificationManager.renderNotificationList(listEl, this.currentUser.studentId);
    }
  }

  /* ---------------- Active Boarding Prompt (Sections 8 & 10) ---------------- */
  renderActiveBoardingPrompt() {
    const bannerContainer = $('#active-boarding-banner-container');
    if (!bannerContainer) return;

    // Find student's active vote for today's current trip
    const morningVote = storage.getStudentVote(this.currentUser.studentId, 'morning');
    if (!morningVote) {
      bannerContainer.innerHTML = '';
      return;
    }

    const bus = storage.getBusById(morningVote.busId);
    const stop = storage.getStopById(morningVote.stopId);
    const route = bus ? storage.getRouteById(bus.routeId) : null;
    const currentStop = route && bus.currentStopIndex !== undefined ? storage.getStopById(route.stopIds[bus.currentStopIndex]) : null;

    const record = storage.getBoardingRecord(this.currentUser.studentId, morningVote.busId, 'morning');
    const currentStatus = record ? record.status : 'Waiting';

    // Condition: Bus is At Stop, and the stop matches the student's selected stop
    const isAtStudentStop = bus && currentStop && currentStop.id === morningVote.stopId && bus.journeyStatus === 'At Stop';

    if (isAtStudentStop && currentStatus === 'Waiting') {
      bannerContainer.innerHTML = `
        <div class="boarding-prompt-banner">
          <div class="boarding-prompt-header">
            <span class="boarding-prompt-icon">🔔</span>
            <div>
              <div class="boarding-prompt-title">Your NTS bus has reached ${escapeHtml(stop.name)}!</div>
              <div class="boarding-prompt-desc">Bus ${escapeHtml(bus.number)} is currently waiting at your stop. Please confirm immediately.</div>
            </div>
          </div>
          <div class="boarding-btn-group">
            <button id="btn-confirm-board" class="btn-board-confirm">
              ✓ YES, I AM BOARDING
            </button>
            <button id="btn-confirm-missed" class="btn-board-missed">
              ✕ I MISSED THE BUS
            </button>
          </div>
        </div>
      `;

      $('#btn-confirm-board')?.addEventListener('click', () => {
        this.confirmBoarding(morningVote.busId, morningVote.stopId, 'morning');
      });

      $('#btn-confirm-missed')?.addEventListener('click', () => {
        this.reportMissedBus(morningVote.busId, morningVote.stopId, 'morning');
      });
    } else if (currentStatus === 'Boarded') {
      bannerContainer.innerHTML = `
        <div class="alert alert-success" style="margin-bottom: 20px;">
          <span style="font-size: 1.25rem;">🟢</span>
          <div>
            <strong>You are marked as BOARDED on ${escapeHtml(bus.number)}.</strong>
            <p style="margin: 0; font-size: 0.85rem;">Have a safe journey to NUST!</p>
          </div>
        </div>
      `;
    } else if (currentStatus === 'Missed Bus') {
      bannerContainer.innerHTML = `
        <div class="alert alert-danger" style="margin-bottom: 20px;">
          <span style="font-size: 1.25rem;">🔴</span>
          <div>
            <strong>You reported that you missed Bus ${escapeHtml(bus.number)} at ${escapeHtml(stop.name)}.</strong>
            <p style="margin: 0; font-size: 0.85rem;">The driver has been notified.</p>
          </div>
        </div>
      `;
    } else {
      bannerContainer.innerHTML = '';
    }
  }

  confirmBoarding(busId, stopId, journeyType) {
    storage.updateBoardingStatus(this.currentUser.studentId, busId, stopId, journeyType, 'Boarded', 'student');
    NTSNotificationManager.notify(
      'Boarding Confirmed',
      'You confirmed your boarding on the bus. Welcome aboard!',
      { userId: this.currentUser.studentId, type: 'success' }
    );
    showToast('Boarding Confirmed', 'Driver screen has been updated in real time.', 'success');
    this.renderActiveTab();
  }

  reportMissedBus(busId, stopId, journeyType) {
    const reason = prompt('Please specify reason (optional):', 'Delayed arriving at stop');
    storage.updateBoardingStatus(this.currentUser.studentId, busId, stopId, journeyType, 'Missed Bus', 'student', reason || '');
    NTSNotificationManager.notify(
      'Missed Bus Reported',
      'You reported that you missed the bus. Driver has been notified.',
      { userId: this.currentUser.studentId, type: 'danger' }
    );
    showToast('Reported Missed', 'Driver list updated immediately.', 'warning');
    this.renderActiveTab();
  }

  /* ---------------- Polling Views (Morning & Return) ---------------- */
  renderPollView(journeyType) {
    const container = $('#student-content-area');
    if (!container) return;

    const polls = storage.getPolls();
    const pollConfig = polls[journeyType] || {};
    const buses = storage.getBuses().filter(b => b.status === 'Active');
    const existingVote = storage.getStudentVote(this.currentUser.studentId, journeyType);

    const isMorning = journeyType === 'morning';
    const pollTitle = isMorning ? 'Going to University (Morning Poll)' : 'Returning from University (Return Poll)';

    let selectionSummaryHtml = '';
    if (existingVote) {
      const selectedBus = storage.getBusById(existingVote.busId);
      const selectedStop = storage.getStopById(existingVote.stopId);
      selectionSummaryHtml = `
        <div class="alert alert-success" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <strong>✓ Your seat request has been recorded.</strong><br>
            You are scheduled to board at: <strong>${escapeHtml(selectedStop ? selectedStop.name : 'Unknown')}</strong>
            on <strong>${escapeHtml(selectedBus ? selectedBus.number : 'Bus')}</strong>.
          </div>
          <button id="btn-cancel-vote" class="btn btn-outline btn-sm" style="background:#fff;">
            Change Selection
          </button>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="poll-section-header">
        <div>
          <h2>${pollTitle}</h2>
          <p>Select your bus and stop to reserve your seat and inform the driver.</p>
        </div>
        <div class="poll-deadline-chip">
          ⏰ Poll Status: <strong>${pollConfig.status || 'Open'}</strong> (Deadline: ${pollConfig.endTime || '08:00 AM'})
        </div>
      </div>

      ${selectionSummaryHtml}

      <div class="buses-list">
        ${buses.map(bus => {
          const driver = storage.getDriverById(bus.assignedDriverId);
          const route = storage.getRouteById(bus.routeId);
          const stops = route ? route.stopIds.map(id => storage.getStopById(id)).filter(Boolean) : [];
          const voteCount = NTSPollingManager.getBusVoteCount(bus.id, journeyType);
          const isSelectedBus = existingVote && existingVote.busId === bus.id;
          const capacityPercent = Math.min(100, Math.round((voteCount / bus.capacity) * 100));

          const fillClass = capacityPercent >= 100 ? 'full' : capacityPercent >= 80 ? 'high' : '';

          return `
            <div class="bus-poll-card ${isSelectedBus ? 'selected-bus' : ''}" data-bus-id="${bus.id}">
              <div class="bus-poll-top">
                <div class="bus-number-tag">
                  🚌 ${escapeHtml(bus.number)}
                  <span class="badge ${bus.journeyStatus === 'At Stop' ? 'badge-warning' : 'badge-info'}">
                    ${bus.journeyStatus}
                  </span>
                </div>
                <div class="bus-capacity-meter">
                  <div class="capacity-text">${voteCount} / ${bus.capacity} seats</div>
                  <div class="capacity-bar">
                    <div class="capacity-fill ${fillClass}" style="width: ${capacityPercent}%;"></div>
                  </div>
                </div>
              </div>

              <div class="bus-details-grid">
                <div class="bus-detail-item">
                  <span class="bus-detail-label">Route</span>
                  <span class="bus-detail-val">${escapeHtml(route ? route.name : 'Wah → NUST')}</span>
                </div>
                <div class="bus-detail-item">
                  <span class="bus-detail-label">Assigned Driver</span>
                  <span class="bus-detail-val">${escapeHtml(driver ? driver.name : 'NTS Driver')}</span>
                </div>
                <div class="bus-detail-item">
                  <span class="bus-detail-label">Number Plate</span>
                  <span class="bus-detail-val">${escapeHtml(bus.plateNumber)}</span>
                </div>
              </div>

              <div class="stop-select-group">
                <label class="form-label" for="select-stop-${bus.id}">Choose Your Boarding Stop:</label>
                <select id="select-stop-${bus.id}" class="form-select">
                  <option value="">-- Select a Stop on this Route --</option>
                  ${stops.map(s => `
                    <option value="${s.id}" ${existingVote && existingVote.busId === bus.id && existingVote.stopId === s.id ? 'selected' : ''}>
                      ${escapeHtml(s.name)}
                    </option>
                  `).join('')}
                </select>
              </div>

              <button class="btn btn-primary btn-vote-bus" data-bus-id="${bus.id}" ${voteCount >= bus.capacity && !isSelectedBus && !pollConfig.allowOverflow ? 'disabled' : ''}>
                ${isSelectedBus ? '✓ Update Seat Selection' : 'Vote for this bus'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Bind voting buttons
    $$('.btn-vote-bus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const busId = e.currentTarget.dataset.busId;
        const select = $(`#select-stop-${busId}`);
        const stopId = select ? select.value : '';

        if (!stopId) {
          showToast('Stop Required', 'Please select your boarding stop from the dropdown list.', 'warning');
          return;
        }

        const result = NTSPollingManager.castVote(this.currentUser.studentId, busId, stopId, journeyType);
        if (result.success) {
          showToast('Seat Reserved', result.message, 'success');
          NTSNotificationManager.notify(
            'Seat Request Recorded',
            `You are scheduled to board ${result.busNumber} at ${result.stopName}.`,
            { userId: this.currentUser.studentId, type: 'success' }
          );
          this.renderActiveTab();
        } else {
          showToast('Voting Error', result.error, 'danger');
        }
      });
    });

    // Bind cancel selection button
    $('#btn-cancel-vote')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to change your seat reservation?')) {
        NTSPollingManager.cancelVote(this.currentUser.studentId, journeyType);
        showToast('Reservation Cleared', 'You can now select a different bus or stop.', 'info');
        this.renderActiveTab();
      }
    });
  }

  /* ---------------- Track My Bus View (Section 11 & 12) ---------------- */
  renderTrackingView() {
    const container = $('#student-content-area');
    if (!container) return;

    const morningVote = storage.getStudentVote(this.currentUser.studentId, 'morning');
    const busId = morningVote ? morningVote.busId : 'bus-01'; // Fallback to demo bus if not voted
    const bus = storage.getBusById(busId);
    const driver = bus ? storage.getDriverById(bus.assignedDriverId) : null;
    const route = bus ? storage.getRouteById(bus.routeId) : null;
    const studentStop = morningVote ? storage.getStopById(morningVote.stopId) : (route ? storage.getStopById(route.stopIds[1]) : null);

    const arrivalInfo = NTSTrackingManager.getBusArrivalStatus(bus, studentStop);

    container.innerHTML = `
      <div class="student-layout">
        <!-- Journey summary card -->
        <div class="journey-summary-card">
          <div class="journey-summary-header">
            <div>
              <span class="journey-badge">${bus ? bus.journeyStatus : 'Active'}</span>
              <h2 style="margin-top: 6px; font-size: 1.6rem;">🚌 ${escapeHtml(bus ? bus.number : 'NTS-01')} Tracking</h2>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.85rem; opacity: 0.85;">Last Location Update</div>
              <div style="font-weight: 800; font-size: 1.15rem;">${bus ? bus.lastUpdated : '10:42 AM'}</div>
            </div>
          </div>

          <div class="journey-metrics">
            <div>
              <div class="journey-metric-label">Assigned Driver</div>
              <div class="journey-metric-value">${escapeHtml(driver ? driver.name : 'Muhammad Ali')}</div>
            </div>
            <div>
              <div class="journey-metric-label">Your Scheduled Stop</div>
              <div class="journey-metric-value">${escapeHtml(studentStop ? studentStop.name : 'Taxila Chowk')}</div>
            </div>
            <div>
              <div class="journey-metric-label">Route Corridor</div>
              <div class="journey-metric-value">${escapeHtml(route ? route.name : 'Wah → NUST')}</div>
            </div>
            <div>
              <div class="journey-metric-label">Current Velocity</div>
              <div class="journey-metric-value">${bus ? bus.speed : '42 km/h'}</div>
            </div>
          </div>
        </div>

        <!-- Live Status Bar -->
        <div class="alert ${arrivalInfo.isAtStop ? 'alert-warning' : 'alert-info'}" style="font-size: 1.05rem; font-weight: 700;">
          <span>📍 Status:</span>
          <span>${arrivalInfo.statusText}</span>
        </div>

        <!-- Interactive Map Display -->
        <div class="route-map-container">
          <div class="map-header">
            <h3>Live Route Map (Wah Cantt - Margalla - NUST)</h3>
            <div style="font-size: 0.85rem; color: var(--text-muted);">
              GPS Telemetry: Lat ${bus ? bus.lat : '33.7438'}, Lng ${bus ? bus.lng : '72.8089'}
            </div>
          </div>
          <div id="student-map-canvas-container" class="map-viewport"></div>
          <div class="map-legend">
            <div class="legend-item"><span class="legend-dot" style="background:#0e5a3c;"></span> Current Bus Position</div>
            <div class="legend-item"><span class="legend-dot" style="background:#d97706;"></span> Your Selected Stop</div>
            <div class="legend-item"><span class="legend-dot" style="background:#16a34a;"></span> Next Stop on Route</div>
          </div>
        </div>

        <!-- Stop Sequence Timeline -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Route Stops Progress</h3>
          </div>
          <div class="stop-timeline">
            ${route ? route.stopIds.map((id, index) => {
              const stopObj = storage.getStopById(id);
              if (!stopObj) return '';
              const isPassed = bus && index < (bus.currentStopIndex || 0);
              const isCurrent = bus && index === (bus.currentStopIndex || 0);
              const isTarget = studentStop && stopObj.id === studentStop.id;

              const stepClass = isCurrent ? 'current' : isPassed ? 'passed' : '';
              return `
                <div class="timeline-step ${stepClass} ${isTarget ? 'target-stop' : ''}">
                  <div class="step-node">${index + 1}</div>
                  <div class="step-label">${escapeHtml(stopObj.name.split(' - ')[0])}</div>
                </div>
              `;
            }).join('') : ''}
          </div>
        </div>
      </div>
    `;

    // Render interactive SVG Route Map
    const mapContainer = $('#student-map-canvas-container');
    if (mapContainer && bus) {
      NTSTrackingManager.renderRouteMap(mapContainer, bus, studentStop ? studentStop.id : null);
    }
  }

  /* ---------------- History View ---------------- */
  renderHistoryView() {
    const container = $('#student-content-area');
    if (!container) return;

    const records = storage.getBoardingRecords().filter(r => r.studentId === this.currentUser.studentId);

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">My Journey & Boarding History</h3>
        </div>
        <p style="margin-bottom: 16px;">Historical record of all bus reservations and stop boarding confirmations.</p>

        <div style="overflow-x: auto;">
          <table class="history-table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Bus</th>
                <th>Journey</th>
                <th>Stop</th>
                <th>Status</th>
                <th>Marked By</th>
              </tr>
            </thead>
            <tbody>
              ${records.length === 0 ? `
                <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No journey records found.</td></tr>
              ` : records.map(r => {
                const bus = storage.getBusById(r.busId);
                const stop = storage.getStopById(r.stopId);
                const statusClass = r.status === 'Boarded' ? 'badge-success' : r.status === 'Missed Bus' ? 'badge-danger' : 'badge-waiting';

                return `
                  <tr>
                    <td><strong>Today</strong>, ${escapeHtml(r.updatedAt || '07:30 AM')}</td>
                    <td><strong>${escapeHtml(bus ? bus.number : 'Bus')}</strong></td>
                    <td style="text-transform: capitalize;">${escapeHtml(r.journeyType)}</td>
                    <td>${escapeHtml(stop ? stop.name : 'Taxila')}</td>
                    <td><span class="badge ${statusClass}">${escapeHtml(r.status)}</span></td>
                    <td style="text-transform: capitalize;">${escapeHtml(r.markedBy)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  startLiveSync() {
    // Keep map and status refreshed smoothly
    if (this.trackingInterval) clearInterval(this.trackingInterval);
    this.trackingInterval = setInterval(() => {
      if (this.currentTab === 'track-bus') {
        const morningVote = storage.getStudentVote(this.currentUser.studentId, 'morning');
        const bus = storage.getBusById(morningVote ? morningVote.busId : 'bus-01');
        const studentStop = morningVote ? storage.getStopById(morningVote.stopId) : null;
        const mapContainer = $('#student-map-canvas-container');
        if (mapContainer && bus) {
          NTSTrackingManager.renderRouteMap(mapContainer, bus, studentStop ? studentStop.id : null);
        }
      }
      this.renderActiveBoardingPrompt();
    }, 4000);
  }

  handleExternalDataChange(detail) {
    this.renderActiveTab();
  }
}
