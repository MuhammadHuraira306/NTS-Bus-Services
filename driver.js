/**
 * NTS Travel Services - Driver Portal Controller
 * HIGH CONTRAST, EXTRA-LARGE TOUCH TARGETS, ZERO TYPING
 * Designed specifically for drivers who may have limited technical knowledge
 */

import { storage } from './storage.js';
import { NTSAuth } from './auth.js';
import { NTSTrackingManager } from './tracking.js';
import { NTSNotificationManager } from './notifications.js';
import { $, $$, showToast, openModal, closeModal, escapeHtml } from './utils.js';

export class DriverPortalController {
  constructor() {
    this.currentUser = NTSAuth.getCurrentUser();
    this.currentView = 'trip-main'; // trip-main | stops-select | student-manifest
    this.isSharingLocation = false;
    this.activeBus = null;
    this.activeRoute = null;
    this.activeStop = null;
  }

  init() {
    if (!NTSAuth.checkRouteAccess('driver')) return;

    this.loadDriverData();
    this.setupEventListeners();
    this.render();

    // Listen for cross-tab storage changes (student boarding or voting)
    window.addEventListener('nts:data-changed', () => {
      this.loadDriverData();
      this.render();
    });
  }

  loadDriverData() {
    const busId = this.currentUser.busId || 'bus-01';
    this.activeBus = storage.getBusById(busId);
    if (!this.activeBus) {
      this.activeBus = storage.getBuses()[0];
    }
    this.activeRoute = storage.getRouteById(this.activeBus.routeId);
    
    // Determine current stop object
    if (this.activeRoute && this.activeRoute.stopIds) {
      const stopIndex = this.activeBus.currentStopIndex || 0;
      const stopId = this.activeRoute.stopIds[stopIndex] || this.activeRoute.stopIds[0];
      this.activeStop = storage.getStopById(stopId);
    }
    this.isSharingLocation = !!this.activeBus.isGpsActive;
  }

  setupEventListeners() {
    // Logout
    $('#btn-driver-logout')?.addEventListener('click', () => NTSAuth.logout());
  }

  render() {
    const container = $('#driver-app-root');
    if (!container) return;

    switch (this.currentView) {
      case 'stops-select':
        this.renderStopsSelectScreen(container);
        break;
      case 'student-manifest':
        this.renderStudentManifestScreen(container);
        break;
      case 'trip-main':
      default:
        this.renderTripMainScreen(container);
        break;
    }
  }

  /* ---------------- Screen 1: Today's Trip Main (Section 6) ---------------- */
  renderTripMainScreen(container) {
    const bus = this.activeBus;
    const route = this.activeRoute;
    const currentStop = this.activeStop;
    const isTripStarted = bus.journeyStatus === 'Trip Started' || bus.journeyStatus === 'At Stop';

    container.innerHTML = `
      <div class="driver-container">
        <!-- Trip Banner -->
        <div class="driver-trip-banner">
          <div class="top-row">
            <div class="driver-bus-badge">
              🚌 ${escapeHtml(bus.number)}
            </div>
            <div class="driver-status-pill ${isTripStarted ? 'active' : ''}">
              ${bus.journeyStatus}
            </div>
          </div>
          <div class="driver-route-name">
            ${escapeHtml(route ? route.name : 'Wah → NUST')}
          </div>
          <div class="driver-current-stop-highlight">
            <div>
              <div class="label">CURRENT STOP / موجودہ سٹاپ</div>
              <div class="stop-name">${escapeHtml(currentStop ? currentStop.name : 'Taxila')}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge ${bus.isGpsActive ? 'badge-success' : 'badge-neutral'}" style="font-size: 0.9rem;">
                ${bus.isGpsActive ? '🟢 GPS ACTIVE' : '⚪ GPS OFF'}
              </span>
            </div>
          </div>
        </div>

        <!-- Very Large Action Buttons (One task per screen) -->
        <div class="driver-actions-grid">
          ${!isTripStarted ? `
            <button id="btn-driver-start-trip" class="btn-driver-huge btn-driver-start">
              <span class="btn-icon">🚀</span>
              <div>
                START TRIP
                <span class="urdu-subtitle">سفر شروع کریں</span>
              </div>
            </button>
          ` : `
            <button id="btn-driver-arrived" class="btn-driver-huge btn-driver-arrived">
              <span class="btn-icon">🛑</span>
              <div>
                ARRIVED AT STOP
                <span class="urdu-subtitle">سٹاپ پر پہنچ گئے</span>
              </div>
            </button>

            <button id="btn-driver-view-students" class="btn-driver-huge btn-driver-start">
              <span class="btn-icon">👥</span>
              <div>
                CHECK STUDENTS (${this.getExpectedStudentsCount(currentStop ? currentStop.id : '')})
                <span class="urdu-subtitle">طلباء کی حاضری</span>
              </div>
            </button>

            <button id="btn-driver-next-stop" class="btn-driver-huge btn-driver-next">
              <span class="btn-icon">➡️</span>
              <div>
                LEAVE / NEXT STOP
                <span class="urdu-subtitle">اگلا سٹاپ / روانہ ہوں</span>
              </div>
            </button>
          `}

          <!-- Location sharing toggle -->
          <button id="btn-driver-toggle-gps" class="btn-driver-huge btn-driver-gps ${this.isSharingLocation ? 'sharing' : ''}">
            <span class="btn-icon">📡</span>
            <div>
              ${this.isSharingLocation ? 'STOP SHARING GPS' : 'SHARE LIVE LOCATION'}
              <span class="urdu-subtitle">براہ راست لوکیشن شیئر کریں</span>
            </div>
          </button>

          ${isTripStarted ? `
            <button id="btn-driver-end-trip" class="btn-driver-huge btn-driver-end">
              <span class="btn-icon">🏁</span>
              <div>
                END TRIP
                <span class="urdu-subtitle">سفر مکمل</span>
              </div>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Safety Departure Modal Dialog (Section 9) -->
      <div id="safety-modal-container"></div>
    `;

    // Bind Actions
    $('#btn-driver-start-trip')?.addEventListener('click', () => {
      this.handleStartTrip();
    });

    $('#btn-driver-arrived')?.addEventListener('click', () => {
      this.currentView = 'stops-select';
      this.render();
    });

    $('#btn-driver-view-students')?.addEventListener('click', () => {
      this.currentView = 'student-manifest';
      this.render();
    });

    $('#btn-driver-next-stop')?.addEventListener('click', () => {
      this.handleLeaveStopRequested();
    });

    $('#btn-driver-toggle-gps')?.addEventListener('click', () => {
      this.handleToggleGps();
    });

    $('#btn-driver-end-trip')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to end today\'s trip?')) {
        this.handleEndTrip();
      }
    });
  }

  /* ---------------- Screen 2: Driver Stop System (Section 7) ---------------- */
  renderStopsSelectScreen(container) {
    const bus = this.activeBus;
    const route = this.activeRoute;
    const stops = route ? route.stopIds.map(id => storage.getStopById(id)).filter(Boolean) : [];
    const currentIndex = bus.currentStopIndex || 0;

    container.innerHTML = `
      <div class="driver-container">
        <button id="btn-back-to-main" class="btn btn-outline btn-lg" style="margin-bottom: 8px;">
          ← BACK TO TRIP / واپسی
        </button>

        <div class="stops-selection-card">
          <div class="stops-selection-title">
            <span>TODAY'S STOPS / آج کے سٹاپس</span>
            <span style="font-size: 0.9rem; color: var(--text-muted);">Tap arrived stop</span>
          </div>

          <div class="driver-stops-list">
            ${stops.map((stop, idx) => {
              const isPassed = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const expectedCount = this.getExpectedStudentsCount(stop.id);

              const dotColor = isPassed ? 'green' : isCurrent ? 'yellow' : 'gray';

              return `
                <div class="driver-stop-item ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''}" data-stop-id="${stop.id}" data-index="${idx}">
                  <div class="driver-stop-info">
                    <span class="stop-status-dot ${dotColor}"></span>
                    <div>
                      <div class="driver-stop-name">${idx + 1}. ${escapeHtml(stop.name)}</div>
                      <div style="font-size: 0.8rem; color: #6b7280;">
                        ${isPassed ? 'Passed' : isCurrent ? 'Bus is currently here' : 'Upcoming stop'}
                      </div>
                    </div>
                  </div>
                  <div class="driver-stop-counts">
                    👥 ${expectedCount} waiting
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    $('#btn-back-to-main')?.addEventListener('click', () => {
      this.currentView = 'trip-main';
      this.render();
    });

    $$('.driver-stop-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const stopId = e.currentTarget.dataset.stopId;
        const index = parseInt(e.currentTarget.dataset.index, 10);
        this.selectStopAsArrived(stopId, index);
      });
    });
  }

  selectStopAsArrived(stopId, index) {
    const bus = this.activeBus;
    const stop = storage.getStopById(stopId);

    // Update bus state in storage
    storage.updateBus(bus.id, {
      currentStopIndex: index,
      journeyStatus: 'At Stop',
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.activeStop = stop;

    // Send high-priority arrival notifications to students waiting at this stop (Section 5 & 8)
    const votes = storage.getVotes().filter(v => v.busId === bus.id && v.stopId === stopId);
    votes.forEach(v => {
      NTSNotificationManager.notify(
        'Bus Reached Your Stop',
        `Your NTS bus (${bus.number}) has reached ${stop.name}. Please confirm boarding.`,
        { userId: v.studentId, type: 'arrival' }
      );
    });

    showToast('Arrived at Stop', `Bus status set to: At ${stop.name}. Students notified.`, 'success');

    // Switch to passenger manifest screen immediately
    this.currentView = 'student-manifest';
    this.loadDriverData();
    this.render();
  }

  /* ---------------- Screen 3: Passenger Manifest Screen (Section 7, 8, 10) ---------------- */
  renderStudentManifestScreen(container) {
    const bus = this.activeBus;
    const currentStop = this.activeStop;
    const stopId = currentStop ? currentStop.id : '';

    // Get all students who selected this bus and stop
    const stopVotes = storage.getVotes().filter(v => v.busId === bus.id && v.stopId === stopId && v.journeyType === bus.currentJourneyType);
    const records = storage.getBoardingRecords();

    // Map student details with current boarding status
    const studentList = stopVotes.map(vote => {
      const student = storage.getStudentById(vote.studentId);
      const record = records.find(r => r.studentId === vote.studentId && r.busId === bus.id && r.journeyType === bus.currentJourneyType);
      return {
        vote,
        student: student || { name: 'Student', phone: '+92 300 0000000', id: vote.studentId },
        status: record ? record.status : 'Waiting',
        reason: record ? record.reason : ''
      };
    });

    const boardedCount = studentList.filter(s => s.status === 'Boarded').length;
    const waitingCount = studentList.filter(s => s.status === 'Waiting').length;
    const missedCount = studentList.filter(s => s.status === 'Missed Bus' || s.status === 'Not Boarded').length;

    container.innerHTML = `
      <div class="driver-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <button id="btn-back-to-trip" class="btn btn-outline btn-lg">
            ← BACK / واپسی
          </button>
          <button id="btn-quick-next" class="btn btn-primary btn-lg" style="background:#1e3a5f;">
            LEAVE STOP ➡️
          </button>
        </div>

        <div class="manifest-card">
          <div class="manifest-header">
            <div>
              <div class="manifest-title">${escapeHtml(currentStop ? currentStop.name.toUpperCase() : 'STOP')}</div>
              <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">STUDENTS EXPECTED / متوقع طلباء</div>
            </div>
            <div class="manifest-counter">
              <span style="color:#16a34a;">${boardedCount} Boarded</span> | 
              <span style="color:#ea580c;">${waitingCount} Waiting</span>
            </div>
          </div>

          <div class="students-manifest-list">
            ${studentList.length === 0 ? `
              <div style="padding: 24px; text-align: center; color: var(--text-muted);">
                <p>No students have selected this stop for this trip.</p>
              </div>
            ` : studentList.map((item, index) => {
              const s = item.student;
              const statusClass = item.status === 'Boarded' ? 'status-boarded' : item.status === 'Missed Bus' ? 'status-missed' : 'status-waiting';

              return `
                <div class="student-row ${statusClass}" data-student-id="${s.id}">
                  <div class="student-main-info">
                    <span class="student-num">${index + 1}.</span>
                    <div>
                      <div class="student-name-text">
                        ${item.status === 'Boarded' ? '🟢' : item.status === 'Missed Bus' ? '🔴' : '🟡'}
                        ${escapeHtml(s.name)}
                      </div>
                      <div class="student-sub-info">
                        Status: <strong>${item.status}</strong> ${item.reason ? `(${escapeHtml(item.reason)})` : ''}
                      </div>
                    </div>
                  </div>

                  <div class="driver-status-toggle-group">
                    <!-- Quick toggle status chips: Zero typing required! -->
                    <button class="btn-driver-chip boarded ${item.status === 'Boarded' ? 'active' : ''}" data-status="Boarded" data-student-id="${s.id}">
                      ✓ Boarded
                    </button>
                    <button class="btn-driver-chip waiting ${item.status === 'Waiting' ? 'active' : ''}" data-status="Waiting" data-student-id="${s.id}">
                      ⏳ Wait
                    </button>
                    <button class="btn-driver-chip missed ${item.status === 'Missed Bus' || item.status === 'Not Boarded' ? 'active' : ''}" data-status="Not Boarded" data-student-id="${s.id}">
                      ✕ Missed
                    </button>

                    ${item.status === 'Missed Bus' || item.status === 'Waiting' ? `
                      <a href="tel:${escapeHtml(s.phone)}" class="btn-call-student" title="Call Student">
                        📞 Call
                      </a>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Safety Departure Modal Dialog Container -->
      <div id="safety-modal-container"></div>
    `;

    $('#btn-back-to-trip')?.addEventListener('click', () => {
      this.currentView = 'trip-main';
      this.render();
    });

    $('#btn-quick-next')?.addEventListener('click', () => {
      this.handleLeaveStopRequested();
    });

    // Handle manual one-click status toggle by driver (Section 8)
    $$('.btn-driver-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const studentId = e.currentTarget.dataset.studentId;
        const newStatus = e.currentTarget.dataset.status;
        this.setStudentBoardingStatus(studentId, newStatus);
      });
    });
  }

  setStudentBoardingStatus(studentId, status) {
    const bus = this.activeBus;
    const stop = this.activeStop;
    storage.updateBoardingStatus(studentId, bus.id, stop ? stop.id : '', bus.currentJourneyType, status, 'driver');
    showToast('Status Updated', `Student marked as ${status}.`, 'info');
    this.render();
  }

  /* ---------------- Section 9: Critical Safety Departure Warning Guard ---------------- */
  handleLeaveStopRequested() {
    const bus = this.activeBus;
    const currentStop = this.activeStop;
    const stopId = currentStop ? currentStop.id : '';

    // Find all students for this stop who have NOT confirmed boarding (Status == Waiting)
    const stopVotes = storage.getVotes().filter(v => v.busId === bus.id && v.stopId === stopId && v.journeyType === bus.currentJourneyType);
    const records = storage.getBoardingRecords();

    const unconfirmedStudents = stopVotes
      .map(v => {
        const student = storage.getStudentById(v.studentId);
        const record = records.find(r => r.studentId === v.studentId && r.busId === bus.id && r.journeyType === bus.currentJourneyType);
        return {
          student: student || { name: 'Student', phone: '+92 300 0000000', id: v.studentId },
          status: record ? record.status : 'Waiting'
        };
      })
      .filter(item => item.status === 'Waiting');

    if (unconfirmedStudents.length > 0) {
      // SAFETY WARNING POPUP (Section 9)
      this.showSafetyWarningModal(unconfirmedStudents);
    } else {
      // All students confirmed (boarded or missed), proceed safely to next stop
      this.advanceToNextStop();
    }
  }

  showSafetyWarningModal(unconfirmedStudents) {
    const modalContainer = $('#safety-modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div id="safety-modal" class="modal-overlay active">
        <div class="modal-dialog safety-warning-modal">
          <div class="safety-warning-header">
            <span>⚠️</span>
            <span>STUDENTS STILL UNCONFIRMED!</span>
          </div>
          <p style="font-size: 1.05rem; color: #1f2937; font-weight: 600;">
            The following student(s) scheduled for this stop have not confirmed boarding:
          </p>

          <div class="unconfirmed-list">
            ${unconfirmedStudents.map(s => `
              <div class="unconfirmed-item">
                <span>👤 ${escapeHtml(s.student.name)}</span>
                <a href="tel:${escapeHtml(s.student.phone)}" class="btn-call-student">
                  📞 Call: ${escapeHtml(s.student.phone)}
                </a>
              </div>
            `).join('')}
          </div>

          <div class="modal-actions" style="justify-content: space-between;">
            <button id="btn-modal-wait" class="btn btn-warning btn-lg" style="flex: 1;">
              ⏳ WAIT FOR STUDENTS
            </button>
            <button id="btn-modal-leave-prompt" class="btn btn-danger btn-lg" style="flex: 1;">
              LEAVE STOP ➡️
            </button>
          </div>
        </div>
      </div>
    `;

    $('#btn-modal-wait')?.addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });

    $('#btn-modal-leave-prompt')?.addEventListener('click', () => {
      // Prompt 2nd confirmation: "2 students have not confirmed boarding. Are you sure?"
      const count = unconfirmedStudents.length;
      if (confirm(`WARNING: ${count} student(s) have not confirmed boarding.\n\nAre you sure you want to proceed and leave them behind?`)) {
        // Mark remaining unconfirmed students as "Not Boarded"
        unconfirmedStudents.forEach(u => {
          storage.updateBoardingStatus(
            u.student.id,
            this.activeBus.id,
            this.activeStop.id,
            this.activeBus.currentJourneyType,
            'Not Boarded',
            'driver',
            'Driver departed stop after warning'
          );
        });
        modalContainer.innerHTML = '';
        this.advanceToNextStop();
      }
    });
  }

  advanceToNextStop() {
    const bus = this.activeBus;
    const route = this.activeRoute;
    if (!route || !route.stopIds) return;

    const currentIndex = bus.currentStopIndex || 0;
    const nextIndex = currentIndex + 1;

    if (nextIndex < route.stopIds.length) {
      const nextStopId = route.stopIds[nextIndex];
      const nextStop = storage.getStopById(nextStopId);

      storage.updateBus(bus.id, {
        currentStopIndex: nextIndex,
        journeyStatus: 'Trip Started',
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      this.activeStop = nextStop;
      this.currentView = 'trip-main';
      showToast('En Route', `Departed previous stop. Next stop: ${nextStop ? nextStop.name : 'Next'}`, 'info');
      this.loadDriverData();
      this.render();
    } else {
      // Reached end of route
      storage.updateBus(bus.id, {
        journeyStatus: 'Completed',
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      showToast('Trip Finished', 'Bus reached the final destination.', 'success');
      this.currentView = 'trip-main';
      this.loadDriverData();
      this.render();
    }
  }

  handleStartTrip() {
    const bus = this.activeBus;
    storage.updateBus(bus.id, {
      journeyStatus: 'Trip Started',
      currentStopIndex: 0,
      isGpsActive: true,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Start location broadcast automatically
    NTSTrackingManager.startBroadcasting(bus.id);
    this.isSharingLocation = true;

    NTSNotificationManager.notify(
      'Trip Started',
      `Bus ${bus.number} has started its journey on ${this.activeRoute ? this.activeRoute.name : 'route'}.`,
      { type: 'info' }
    );

    showToast('Trip Started', 'GPS broadcast started. Drive safely!', 'success');
    this.loadDriverData();
    this.render();
  }

  handleToggleGps() {
    const bus = this.activeBus;
    if (this.isSharingLocation) {
      NTSTrackingManager.stopBroadcasting(bus.id);
      this.isSharingLocation = false;
      showToast('GPS Paused', 'Location sharing paused.', 'info');
    } else {
      NTSTrackingManager.startBroadcasting(bus.id);
      this.isSharingLocation = true;
      showToast('GPS Active', 'Sharing live coordinates with students.', 'success');
    }
    this.loadDriverData();
    this.render();
  }

  handleEndTrip() {
    const bus = this.activeBus;
    NTSTrackingManager.stopBroadcasting(bus.id);
    this.isSharingLocation = false;

    storage.updateBus(bus.id, {
      journeyStatus: 'Completed',
      isGpsActive: false,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    showToast('Trip Ended', 'Today\'s journey has been marked completed.', 'info');
    this.loadDriverData();
    this.render();
  }

  getExpectedStudentsCount(stopId) {
    if (!stopId) return 0;
    const votes = storage.getVotes();
    return votes.filter(v => v.busId === this.activeBus.id && v.stopId === stopId && v.journeyType === this.activeBus.currentJourneyType).length;
  }
}
