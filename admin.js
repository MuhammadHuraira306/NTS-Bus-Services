/**
 * NTS Travel Services - Admin Portal Controller
 * Complete Transportation System Administration
 */

import { storage } from './storage.js';
import { NTSAuth } from './auth.js';
import { NTSPollingManager } from './polling.js';
import { $, $$, showToast, openModal, closeModal, escapeHtml } from './utils.js';

export class AdminPortalController {
  constructor() {
    this.currentUser = NTSAuth.getCurrentUser();
    this.currentTab = 'dashboard'; // dashboard | fleet | buses | stops | routes | drivers | students | polls | records
    this.searchQuery = '';
  }

  init() {
    if (!NTSAuth.checkRouteAccess('admin')) return;

    this.setupEventListeners();
    this.render();

    window.addEventListener('nts:data-changed', () => {
      this.render();
    });
  }

  setupEventListeners() {
    $$('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    $('#btn-admin-logout')?.addEventListener('click', () => NTSAuth.logout());
  }

  switchTab(tab) {
    this.currentTab = tab;
    $$('.admin-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    this.render();
  }

  render() {
    const container = $('#admin-content-area');
    if (!container) return;

    switch (this.currentTab) {
      case 'fleet':
        this.renderFleetMonitoring(container);
        break;
      case 'buses':
        this.renderBusManagement(container);
        break;
      case 'stops':
        this.renderStopManagement(container);
        break;
      case 'routes':
        this.renderRouteManagement(container);
        break;
      case 'drivers':
        this.renderDriverManagement(container);
        break;
      case 'students':
        this.renderStudentManagement(container);
        break;
      case 'polls':
        this.renderPollingManagement(container);
        break;
      case 'records':
        this.renderBoardingRecords(container);
        break;
      case 'dashboard':
      default:
        this.renderDashboardOverview(container);
        break;
    }
  }

  /* ---------------- 1. Dashboard Overview (Section 20) ---------------- */
  renderDashboardOverview(container) {
    const buses = storage.getBuses();
    const students = storage.getStudents();
    const drivers = storage.getDrivers();
    const stops = storage.getStops();
    const records = storage.getBoardingRecords();
    const votes = storage.getVotes();

    const activeBuses = buses.filter(b => b.status === 'Active').length;
    const onboardCount = records.filter(r => r.status === 'Boarded').length;
    const missedCount = records.filter(r => r.status === 'Missed Bus' || r.status === 'Not Boarded').length;
    const activeDrivers = drivers.filter(d => d.status === 'Active').length;
    const totalPassengersToday = votes.length;

    const morningDemandByStop = NTSPollingManager.getDemandByStop('morning');

    container.innerHTML = `
      <div class="admin-layout">
        <!-- Key Metrics Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-title">Active Buses</span>
            <span class="stat-value">${activeBuses} / ${buses.length}</span>
            <span class="stat-subtitle">Operational in fleet</span>
          </div>

          <div class="stat-card stat-accent">
            <span class="stat-title">Registered Students</span>
            <span class="stat-value">${students.length}</span>
            <span class="stat-subtitle">Enrolled in portal</span>
          </div>

          <div class="stat-card stat-success">
            <span class="stat-title">Students Onboard</span>
            <span class="stat-value">${onboardCount}</span>
            <span class="stat-subtitle">Confirmed boarding</span>
          </div>

          <div class="stat-card stat-danger">
            <span class="stat-title">Missed Pickups</span>
            <span class="stat-value">${missedCount}</span>
            <span class="stat-subtitle">Reported / left behind</span>
          </div>

          <div class="stat-card stat-secondary">
            <span class="stat-title">Active Drivers</span>
            <span class="stat-value">${activeDrivers} / ${drivers.length}</span>
            <span class="stat-subtitle">On duty today</span>
          </div>

          <div class="stat-card">
            <span class="stat-title">Total Stops</span>
            <span class="stat-value">${stops.length}</span>
            <span class="stat-subtitle">Configured corridors</span>
          </div>
        </div>

        <!-- Two Column Layout: Active Fleet & Demand Charts -->
        <div class="grid-2">
          <!-- Active Buses Live Snapshot -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">🚌 Active Fleet Live Snapshot</h3>
              <button class="btn btn-outline btn-sm" id="btn-view-fleet-tab">View All</button>
            </div>
            <div class="fleet-grid" style="grid-template-columns: 1fr;">
              ${buses.slice(0, 3).map(bus => {
                const driver = storage.getDriverById(bus.assignedDriverId);
                const route = storage.getRouteById(bus.routeId);
                const currentStop = route && bus.currentStopIndex !== undefined ? storage.getStopById(route.stopIds[bus.currentStopIndex]) : null;
                const busVotes = storage.getVotes().filter(v => v.busId === bus.id);

                return `
                  <div class="bus-monitor-card ${bus.journeyStatus === 'At Stop' || bus.journeyStatus === 'Trip Started' ? 'active-trip' : ''}">
                    <div class="bus-monitor-top">
                      <div class="bus-monitor-id">
                        🚌 ${escapeHtml(bus.number)}
                        <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted);">(${escapeHtml(bus.plateNumber)})</span>
                      </div>
                      <span class="badge ${bus.journeyStatus === 'At Stop' ? 'badge-warning' : 'badge-success'}">
                        ${bus.journeyStatus}
                      </span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">
                      Route: <strong>${escapeHtml(route ? route.name : 'Corridor')}</strong> | Driver: <strong>${escapeHtml(driver ? driver.name : 'Driver')}</strong>
                    </div>
                    <div>
                      Current Stop: <strong style="color: var(--primary);">${escapeHtml(currentStop ? currentStop.name : 'Wah Cantt')}</strong>
                    </div>
                    <div class="bus-passenger-bar">
                      <div class="bus-passenger-bar-label">
                        <span>Passenger Load</span>
                        <span>${busVotes.length} / ${bus.capacity} seats</span>
                      </div>
                      <div class="capacity-bar" style="width: 100%;">
                        <div class="capacity-fill" style="width: ${Math.min(100, Math.round((busVotes.length / bus.capacity) * 100))}%;"></div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Polling Demand Distribution Chart (Pure CSS Bar Chart) -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">📊 Morning Stop Demand Distribution</h3>
              <span class="badge badge-info">Live Votes</span>
            </div>
            <p style="margin-bottom: 16px; font-size: 0.88rem;">Passenger demand clustered by stop to guide bus allocation.</p>

            <div class="demand-distribution-container">
              ${morningDemandByStop.length === 0 ? `
                <p style="color: var(--text-muted); text-align: center; padding: 24px;">No votes recorded for morning poll.</p>
              ` : morningDemandByStop.map(item => {
                const maxCount = Math.max(...morningDemandByStop.map(d => d.count), 1);
                const pct = Math.round((item.count / maxCount) * 100);

                return `
                  <div class="demand-bar-item">
                    <div class="demand-bar-header">
                      <span>${escapeHtml(item.stopName)}</span>
                      <strong>${item.count} students</strong>
                    </div>
                    <div class="demand-progress-track">
                      <div class="demand-progress-fill" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    $('#btn-view-fleet-tab')?.addEventListener('click', () => {
      this.switchTab('fleet');
    });
  }

  /* ---------------- 2. Fleet Monitoring (Section 19) ---------------- */
  renderFleetMonitoring(container) {
    const buses = storage.getBuses();

    container.innerHTML = `
      <div class="admin-layout">
        <div class="card-header" style="background:#fff; padding: 16px; border-radius: var(--radius-md); border:1px solid var(--border-color);">
          <div>
            <h2>Live Fleet Monitoring</h2>
            <p>Real-time telemetry, passenger load, and route progression for all buses.</p>
          </div>
        </div>

        <div class="fleet-grid">
          ${buses.map(bus => {
            const driver = storage.getDriverById(bus.assignedDriverId);
            const route = storage.getRouteById(bus.routeId);
            const currentStop = route && bus.currentStopIndex !== undefined ? storage.getStopById(route.stopIds[bus.currentStopIndex]) : null;
            const busVotes = storage.getVotes().filter(v => v.busId === bus.id);

            return `
              <div class="bus-monitor-card ${bus.status === 'Active' ? 'active-trip' : ''}">
                <div class="bus-monitor-top">
                  <div class="bus-monitor-id">
                    🚌 ${escapeHtml(bus.number)}
                  </div>
                  <span class="badge ${bus.status === 'Active' ? 'badge-success' : 'badge-neutral'}">
                    ${bus.status}
                  </span>
                </div>

                <div style="font-size: 0.88rem; display: flex; flex-direction: column; gap: 4px;">
                  <div>Registration Plate: <strong>${escapeHtml(bus.plateNumber)}</strong></div>
                  <div>Assigned Driver: <strong>${escapeHtml(driver ? driver.name : 'None')}</strong></div>
                  <div>Route: <strong>${escapeHtml(route ? route.name : 'Wah → NUST')}</strong></div>
                  <div>Current Stop: <strong style="color:var(--primary);">${escapeHtml(currentStop ? currentStop.name : 'Terminal')}</strong></div>
                  <div>GPS Coordinates: <code>${bus.lat}, ${bus.lng}</code></div>
                  <div>Speed: <strong>${bus.speed || '0 km/h'}</strong></div>
                  <div>Last Updated: <strong>${bus.lastUpdated || 'N/A'}</strong></div>
                </div>

                <div class="bus-passenger-bar">
                  <div class="bus-passenger-bar-label">
                    <span>Passenger Capacity</span>
                    <strong>${busVotes.length} / ${bus.capacity} seats</strong>
                  </div>
                  <div class="capacity-bar" style="width: 100%;">
                    <div class="capacity-fill" style="width: ${Math.min(100, Math.round((busVotes.length / bus.capacity) * 100))}%;"></div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /* ---------------- 3. Bus Management (Section 13) ---------------- */
  renderBusManagement(container) {
    const buses = storage.getBuses();
    const drivers = storage.getDrivers();
    const routes = storage.getRoutes();

    container.innerHTML = `
      <div class="admin-layout">
        <div class="table-container">
          <div class="table-toolbar">
            <div>
              <h3>Bus Fleet Management</h3>
              <p style="font-size:0.85rem; margin:0;">Configure university buses, registration plates, drivers, and capacity.</p>
            </div>
            <button id="btn-add-bus" class="btn btn-primary btn-sm">+ Add New Bus</button>
          </div>

          <div style="overflow-x:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Bus No.</th>
                  <th>Number Plate</th>
                  <th>Route</th>
                  <th>Driver</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${buses.map(b => {
                  const driver = drivers.find(d => d.id === b.assignedDriverId);
                  const route = routes.find(r => r.id === b.routeId);

                  return `
                    <tr>
                      <td><strong>${escapeHtml(b.number)}</strong></td>
                      <td>${escapeHtml(b.plateNumber)}</td>
                      <td>${escapeHtml(route ? route.name : 'Wah → NUST')}</td>
                      <td>${escapeHtml(driver ? driver.name : 'Unassigned')}</td>
                      <td><strong>${b.capacity}</strong> seats</td>
                      <td><span class="badge ${b.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${b.status}</span></td>
                      <td>
                        <div class="actions-cell">
                          <button class="btn btn-outline btn-sm btn-edit-bus" data-bus-id="${b.id}">Edit</button>
                          <button class="btn btn-outline btn-sm btn-toggle-bus-status" data-bus-id="${b.id}">
                            ${b.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="admin-modal-container"></div>
    `;

    $('#btn-add-bus')?.addEventListener('click', () => {
      this.showAddBusModal();
    });

    $$('.btn-toggle-bus-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const busId = e.currentTarget.dataset.busId;
        const bus = storage.getBusById(busId);
        if (bus) {
          const newStatus = bus.status === 'Active' ? 'Inactive' : 'Active';
          storage.updateBus(busId, { status: newStatus });
          showToast('Updated', `Bus ${bus.number} status changed to ${newStatus}.`, 'info');
          this.render();
        }
      });
    });

    $$('.btn-edit-bus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const busId = e.currentTarget.dataset.busId;
        this.showEditBusModal(busId);
      });
    });
  }

  showAddBusModal() {
    const modalContainer = $('#admin-modal-container');
    const drivers = storage.getDrivers();
    const routes = storage.getRoutes();

    modalContainer.innerHTML = `
      <div class="modal-overlay active">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Add New Bus</h3>
            <button class="modal-close" id="btn-modal-close">&times;</button>
          </div>
          <form id="form-add-bus">
            <div class="form-group">
              <label class="form-label">Bus Number/Name:</label>
              <input type="text" class="form-control" id="new-bus-num" placeholder="e.g. NTS-06" required>
            </div>
            <div class="form-group">
              <label class="form-label">Registration / Number Plate:</label>
              <input type="text" class="form-control" id="new-bus-plate" placeholder="e.g. LEA-9900" required>
            </div>
            <div class="form-group">
              <label class="form-label">Capacity:</label>
              <input type="number" class="form-control" id="new-bus-cap" value="40" min="15" max="60" required>
            </div>
            <div class="form-group">
              <label class="form-label">Assign Route:</label>
              <select class="form-select" id="new-bus-route">
                ${routes.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Assign Driver:</label>
              <select class="form-select" id="new-bus-driver">
                ${drivers.map(d => `<option value="${d.id}">${escapeHtml(d.name)} (${d.driverId})</option>`).join('')}
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="btn-cancel-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Bus</button>
            </div>
          </form>
        </div>
      </div>
    `;

    $('#btn-modal-close')?.addEventListener('click', () => modalContainer.innerHTML = '');
    $('#btn-cancel-modal')?.addEventListener('click', () => modalContainer.innerHTML = '');

    $('#form-add-bus')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const num = $('#new-bus-num').value.trim();
      const plate = $('#new-bus-plate').value.trim();
      const cap = parseInt($('#new-bus-cap').value, 10);
      const routeId = $('#new-bus-route').value;
      const driverId = $('#new-bus-driver').value;

      const buses = storage.getBuses();
      buses.push({
        id: 'bus-' + Date.now(),
        number: num,
        plateNumber: plate,
        capacity: cap,
        assignedDriverId: driverId,
        routeId: routeId,
        status: 'Active',
        currentJourneyType: 'morning',
        currentStopIndex: 0,
        journeyStatus: 'Scheduled',
        lat: 33.7438,
        lng: 72.8089,
        speed: '0 km/h',
        heading: 'N',
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGpsActive: false
      });

      storage.saveBuses(buses);
      modalContainer.innerHTML = '';
      showToast('Bus Added', `${num} added to fleet successfully.`, 'success');
      this.render();
    });
  }

  showEditBusModal(busId) {
    const bus = storage.getBusById(busId);
    if (!bus) return;
    const modalContainer = $('#admin-modal-container');
    const drivers = storage.getDrivers();
    const routes = storage.getRoutes();

    modalContainer.innerHTML = `
      <div class="modal-overlay active">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Edit Bus ${escapeHtml(bus.number)}</h3>
            <button class="modal-close" id="btn-modal-close">&times;</button>
          </div>
          <form id="form-edit-bus">
            <div class="form-group">
              <label class="form-label">Bus Number:</label>
              <input type="text" class="form-control" id="edit-bus-num" value="${escapeHtml(bus.number)}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Number Plate:</label>
              <input type="text" class="form-control" id="edit-bus-plate" value="${escapeHtml(bus.plateNumber)}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Capacity:</label>
              <input type="number" class="form-control" id="edit-bus-cap" value="${bus.capacity}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Assigned Driver:</label>
              <select class="form-select" id="edit-bus-driver">
                ${drivers.map(d => `<option value="${d.id}" ${d.id === bus.assignedDriverId ? 'selected' : ''}>${escapeHtml(d.name)}</option>`).join('')}
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="btn-cancel-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Update Bus</button>
            </div>
          </form>
        </div>
      </div>
    `;

    $('#btn-modal-close')?.addEventListener('click', () => modalContainer.innerHTML = '');
    $('#btn-cancel-modal')?.addEventListener('click', () => modalContainer.innerHTML = '');

    $('#form-edit-bus')?.addEventListener('submit', (e) => {
      e.preventDefault();
      storage.updateBus(busId, {
        number: $('#edit-bus-num').value.trim(),
        plateNumber: $('#edit-bus-plate').value.trim(),
        capacity: parseInt($('#edit-bus-cap').value, 10),
        assignedDriverId: $('#edit-bus-driver').value
      });
      modalContainer.innerHTML = '';
      showToast('Bus Updated', 'Bus details updated.', 'success');
      this.render();
    });
  }

  /* ---------------- 4. Stop Management & Reordering (Section 14) ---------------- */
  renderStopManagement(container) {
    const stops = storage.getStops().sort((a, b) => a.sequence - b.sequence);

    container.innerHTML = `
      <div class="admin-layout">
        <div class="table-container">
          <div class="table-toolbar">
            <div>
              <h3>Stop Management & Sequence Ordering</h3>
              <p style="font-size:0.85rem; margin:0;">Use UP/DOWN arrows to change the stop sequence for the route corridor.</p>
            </div>
            <button id="btn-add-stop" class="btn btn-primary btn-sm">+ Add New Stop</button>
          </div>

          <div style="overflow-x:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Stop Name</th>
                  <th>Landmark Location</th>
                  <th>Coordinates (Lat, Lng)</th>
                  <th>Status</th>
                  <th>Reorder</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${stops.map((s, idx) => `
                  <tr>
                    <td><strong>#${s.sequence}</strong></td>
                    <td><strong>${escapeHtml(s.name)}</strong></td>
                    <td>${escapeHtml(s.location)}</td>
                    <td><code>${s.lat}, ${s.lng}</code></td>
                    <td><span class="badge ${s.isActive ? 'badge-success' : 'badge-neutral'}">${s.isActive ? 'Active' : 'Disabled'}</span></td>
                    <td>
                      <div class="order-btn-group">
                        <button class="btn-order-arrow btn-stop-up" data-index="${idx}" ${idx === 0 ? 'disabled' : ''} title="Move Up">▲</button>
                        <button class="btn-order-arrow btn-stop-down" data-index="${idx}" ${idx === stops.length - 1 ? 'disabled' : ''} title="Move Down">▼</button>
                      </div>
                    </td>
                    <td>
                      <div class="actions-cell">
                        <button class="btn btn-outline btn-sm btn-delete-stop" data-stop-id="${s.id}">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="admin-modal-container"></div>
    `;

    // Reordering handlers (Section 14)
    $$('.btn-stop-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        if (idx > 0) {
          this.swapStopOrder(idx, idx - 1);
        }
      });
    });

    $$('.btn-stop-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        if (idx < stops.length - 1) {
          this.swapStopOrder(idx, idx + 1);
        }
      });
    });

    $$('.btn-delete-stop').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stopId = e.currentTarget.dataset.stopId;
        if (confirm('Are you sure you want to delete this stop?')) {
          const filtered = storage.getStops().filter(s => s.id !== stopId);
          storage.saveStops(filtered);
          showToast('Stop Deleted', 'Stop removed.', 'info');
          this.render();
        }
      });
    });

    $('#btn-add-stop')?.addEventListener('click', () => {
      this.showAddStopModal();
    });
  }

  swapStopOrder(indexA, indexB) {
    const stops = storage.getStops().sort((a, b) => a.sequence - b.sequence);
    const tempSeq = stops[indexA].sequence;
    stops[indexA].sequence = stops[indexB].sequence;
    stops[indexB].sequence = tempSeq;

    storage.saveStops(stops);
    showToast('Sequence Updated', 'Stop route order saved.', 'success');
    this.render();
  }

  showAddStopModal() {
    const modalContainer = $('#admin-modal-container');
    const stops = storage.getStops();

    modalContainer.innerHTML = `
      <div class="modal-overlay active">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Add New Corridor Stop</h3>
            <button class="modal-close" id="btn-modal-close">&times;</button>
          </div>
          <form id="form-add-stop">
            <div class="form-group">
              <label class="form-label">Stop Name:</label>
              <input type="text" class="form-control" id="new-stop-name" placeholder="e.g. Tarnol Phatak" required>
            </div>
            <div class="form-group">
              <label class="form-label">Location / Landmark:</label>
              <input type="text" class="form-control" id="new-stop-loc" placeholder="e.g. Near Railway crossing" required>
            </div>
            <div class="form-group">
              <label class="form-label">Latitude:</label>
              <input type="number" step="0.0001" class="form-control" id="new-stop-lat" value="33.6800" required>
            </div>
            <div class="form-group">
              <label class="form-label">Longitude:</label>
              <input type="number" step="0.0001" class="form-control" id="new-stop-lng" value="72.9000" required>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="btn-cancel-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Stop</button>
            </div>
          </form>
        </div>
      </div>
    `;

    $('#btn-modal-close')?.addEventListener('click', () => modalContainer.innerHTML = '');
    $('#btn-cancel-modal')?.addEventListener('click', () => modalContainer.innerHTML = '');

    $('#form-add-stop')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const newStop = {
        id: 'stop-' + Date.now(),
        name: $('#new-stop-name').value.trim(),
        location: $('#new-stop-loc').value.trim(),
        lat: parseFloat($('#new-stop-lat').value),
        lng: parseFloat($('#new-stop-lng').value),
        routeId: 'route-wah-nust',
        sequence: stops.length + 1,
        isActive: true
      };

      stops.push(newStop);
      storage.saveStops(stops);
      modalContainer.innerHTML = '';
      showToast('Stop Created', `${newStop.name} added to route.`, 'success');
      this.render();
    });
  }

  /* ---------------- 5. Route Management (Section 15) ---------------- */
  renderRouteManagement(container) {
    const routes = storage.getRoutes();

    container.innerHTML = `
      <div class="admin-layout">
        <div class="table-container">
          <div class="table-toolbar">
            <div>
              <h3>Route Corridor Management</h3>
              <p style="font-size:0.85rem; margin:0;">Define origin, destination, and reusable sequence of stops.</p>
            </div>
          </div>

          <div style="padding: 20px;">
            ${routes.map(r => {
              const stopObjects = r.stopIds.map(id => storage.getStopById(id)).filter(Boolean);

              return `
                <div class="card" style="margin-bottom: 16px;">
                  <div class="card-header">
                    <h4 style="color:var(--primary); font-size:1.15rem;">🛤️ ${escapeHtml(r.name)}</h4>
                    <span class="badge badge-info">Est. ${r.estimatedDurationMinutes} mins</span>
                  </div>
                  <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 12px;">
                    <strong>Origin:</strong> ${escapeHtml(r.origin)} &nbsp;|&nbsp; <strong>Destination:</strong> ${escapeHtml(r.destination)}
                  </div>
                  <div>
                    <strong>Configured Stops Sequence:</strong>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
                      ${stopObjects.map((s, i) => `
                        <span class="badge badge-neutral" style="font-size: 0.85rem; padding: 6px 10px;">
                          ${i + 1}. ${escapeHtml(s.name)}
                        </span>
                      `).join(' → ')}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /* ---------------- 6. Driver Management (Section 16) ---------------- */
  renderDriverManagement(container) {
    const drivers = storage.getDrivers();
    const buses = storage.getBuses();

    container.innerHTML = `
      <div class="admin-layout">
        <div class="table-container">
          <div class="table-toolbar">
            <div>
              <h3>Driver Directory & Bus Assignments</h3>
              <p style="font-size:0.85rem; margin:0;">Manage transportation staff, contact details, and vehicle pairing.</p>
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Driver ID</th>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Assigned Bus</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${drivers.map(d => {
                  const bus = buses.find(b => b.id === d.assignedBusId);

                  return `
                    <tr>
                      <td><code>${escapeHtml(d.driverId)}</code></td>
                      <td><strong>${escapeHtml(d.name)}</strong></td>
                      <td><a href="tel:${escapeHtml(d.phone)}">📞 ${escapeHtml(d.phone)}</a></td>
                      <td><strong>${escapeHtml(bus ? bus.number : 'None')}</strong></td>
                      <td><span class="badge ${d.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${d.status}</span></td>
                      <td>
                        <button class="btn btn-outline btn-sm btn-toggle-driver" data-driver-id="${d.id}">
                          ${d.status === 'Active' ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    $$('.btn-toggle-driver').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const driverId = e.currentTarget.dataset.driverId;
        const driver = storage.getDriverById(driverId);
        if (driver) {
          const newStatus = driver.status === 'Active' ? 'Inactive' : 'Active';
          const drivers = storage.getDrivers();
          const target = drivers.find(d => d.id === driverId);
          if (target) {
            target.status = newStatus;
            storage.saveDrivers(drivers);
            showToast('Driver Updated', `${driver.name} is now ${newStatus}.`, 'info');
            this.render();
          }
        }
      });
    });
  }

  /* ---------------- 7. Student Management (Section 17) ---------------- */
  renderStudentManagement(container) {
    const students = storage.getStudents();
    const votes = storage.getVotes();

    container.innerHTML = `
      <div class="admin-layout">
        <div class="table-container">
          <div class="table-toolbar">
            <div>
              <h3>Student Roster & Transportation Status</h3>
              <p style="font-size:0.85rem; margin:0;">20 registered university students with active poll reservations.</p>
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Morning Poll Choice</th>
                  <th>Return Poll Choice</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${students.map(s => {
                  const morningVote = votes.find(v => v.studentId === s.id && v.journeyType === 'morning');
                  const returnVote = votes.find(v => v.studentId === s.id && v.journeyType === 'return');

                  const morningBus = morningVote ? storage.getBusById(morningVote.busId) : null;
                  const morningStop = morningVote ? storage.getStopById(morningVote.stopId) : null;

                  return `
                    <tr>
                      <td><code>${escapeHtml(s.studentId)}</code></td>
                      <td><strong>${escapeHtml(s.name)}</strong></td>
                      <td>${escapeHtml(s.department)}</td>
                      <td>${escapeHtml(s.phone)}</td>
                      <td>
                        ${morningVote ? `
                          <span class="badge badge-success">
                            ${morningBus ? morningBus.number : 'Bus'} @ ${morningStop ? morningStop.name.split(' - ')[0] : 'Stop'}
                          </span>
                        ` : '<span style="color:var(--text-light);">No vote</span>'}
                      </td>
                      <td>
                        ${returnVote ? `<span class="badge badge-info">Return Reserved</span>` : '<span style="color:var(--text-light);">No vote</span>'}
                      </td>
                      <td><span class="badge ${s.status === 'Active' ? 'badge-success' : 'badge-danger'}">${s.status}</span></td>
                      <td>
                        <button class="btn btn-outline btn-sm btn-toggle-student" data-student-id="${s.id}">
                          ${s.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    $$('.btn-toggle-student').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sId = e.currentTarget.dataset.studentId;
        const all = storage.getStudents();
        const target = all.find(s => s.id === sId);
        if (target) {
          target.status = target.status === 'Active' ? 'Inactive' : 'Active';
          storage.saveStudents(all);
          showToast('Updated', `Student status updated.`, 'info');
          this.render();
        }
      });
    });
  }

  /* ---------------- 8. Polling Management (Section 18) ---------------- */
  renderPollingManagement(container) {
    const polls = storage.getPolls();
    const morningPoll = polls.morning || {};
    const returnPoll = polls.return || {};

    const morningVotes = storage.getVotes().filter(v => v.journeyType === 'morning');
    const returnVotes = storage.getVotes().filter(v => v.journeyType === 'return');
    const buses = storage.getBuses();

    container.innerHTML = `
      <div class="admin-layout">
        <div class="grid-2">
          <!-- Morning Poll Card -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">🌅 Morning Journey Poll ("Going to University")</h3>
              <span class="badge ${morningPoll.status === 'Open' ? 'badge-success' : 'badge-danger'}">
                ${morningPoll.status}
              </span>
            </div>
            <p style="font-size: 0.9rem; margin-bottom: 14px;">
              Active Deadline: <strong>${morningPoll.endTime || '08:00 AM'}</strong> | Total Votes: <strong>${morningVotes.length}</strong>
            </p>

            <div style="margin-bottom: 16px;">
              <strong>Votes Per Bus:</strong>
              ${buses.map(b => {
                const count = morningVotes.filter(v => v.busId === b.id).length;
                return `
                  <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                    <span>🚌 ${b.number} (${b.plateNumber})</span>
                    <strong>${count} students</strong>
                  </div>
                `;
              }).join('')}
            </div>

            <div style="display: flex; gap: 8px;">
              <button id="btn-toggle-morning-poll" class="btn ${morningPoll.status === 'Open' ? 'btn-danger' : 'btn-success'} btn-sm">
                ${morningPoll.status === 'Open' ? 'Close Morning Poll' : 'Open Morning Poll'}
              </button>
            </div>
          </div>

          <!-- Return Poll Card -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">🌇 Return Journey Poll ("Returning from University")</h3>
              <span class="badge ${returnPoll.status === 'Open' ? 'badge-success' : 'badge-danger'}">
                ${returnPoll.status}
              </span>
            </div>
            <p style="font-size: 0.9rem; margin-bottom: 14px;">
              Active Deadline: <strong>${returnPoll.endTime || '05:00 PM'}</strong> | Total Votes: <strong>${returnVotes.length}</strong>
            </p>

            <div style="margin-bottom: 16px;">
              <strong>Votes Per Bus:</strong>
              ${buses.map(b => {
                const count = returnVotes.filter(v => v.busId === b.id).length;
                return `
                  <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                    <span>🚌 ${b.number}</span>
                    <strong>${count} students</strong>
                  </div>
                `;
              }).join('')}
            </div>

            <div style="display: flex; gap: 8px;">
              <button id="btn-toggle-return-poll" class="btn ${returnPoll.status === 'Open' ? 'btn-danger' : 'btn-success'} btn-sm">
                ${returnPoll.status === 'Open' ? 'Close Return Poll' : 'Open Return Poll'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    $('#btn-toggle-morning-poll')?.addEventListener('click', () => {
      morningPoll.status = morningPoll.status === 'Open' ? 'Closed' : 'Open';
      storage.savePolls(polls);
      showToast('Poll Updated', `Morning poll is now ${morningPoll.status}.`, 'info');
      this.render();
    });

    $('#btn-toggle-return-poll')?.addEventListener('click', () => {
      returnPoll.status = returnPoll.status === 'Open' ? 'Closed' : 'Open';
      storage.savePolls(polls);
      showToast('Poll Updated', `Return poll is now ${returnPoll.status}.`, 'info');
      this.render();
    });
  }

  /* ---------------- 9. Boarding Records & Audit Log ---------------- */
  renderBoardingRecords(container) {
    const records = storage.getBoardingRecords();

    container.innerHTML = `
      <div class="admin-layout">
        <div class="table-container">
          <div class="table-toolbar">
            <div>
              <h3>Today's Boarding Manifest Audit Log</h3>
              <p style="font-size:0.85rem; margin:0;">Complete log of every student boarding confirmation, wait status, and missed bus reports.</p>
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Student Name</th>
                  <th>Bus</th>
                  <th>Stop</th>
                  <th>Journey</th>
                  <th>Status</th>
                  <th>Marked By</th>
                  <th>Note / Reason</th>
                </tr>
              </thead>
              <tbody>
                ${records.map(r => {
                  const student = storage.getStudentById(r.studentId);
                  const bus = storage.getBusById(r.busId);
                  const stop = storage.getStopById(r.stopId);
                  const statusBadge = r.status === 'Boarded' ? 'badge-success' : r.status === 'Missed Bus' ? 'badge-danger' : 'badge-waiting';

                  return `
                    <tr>
                      <td><code>${escapeHtml(r.updatedAt)}</code></td>
                      <td><strong>${escapeHtml(student ? student.name : 'Student')}</strong></td>
                      <td><strong>${escapeHtml(bus ? bus.number : 'Bus')}</strong></td>
                      <td>${escapeHtml(stop ? stop.name : 'Taxila')}</td>
                      <td style="text-transform: capitalize;">${escapeHtml(r.journeyType)}</td>
                      <td><span class="badge ${statusBadge}">${escapeHtml(r.status)}</span></td>
                      <td style="text-transform: capitalize;">${escapeHtml(r.markedBy)}</td>
                      <td>${escapeHtml(r.reason || '—')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
}
