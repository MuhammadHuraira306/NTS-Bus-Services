/**
 * NTS Travel Services - Storage Layer
 * LocalStorage Simulation with Event-Driven Multi-Tab Synchronization
 *
 * FUTURE BACKEND:
 * Replace these LocalStorage methods with async API calls:
 * e.g., fetch('/api/v1/buses') or WebSocket subscriptions.
 */

import { INITIAL_DEMO_DATA } from './data.js';

const STORAGE_KEYS = {
  BUSES: 'nts_buses_v1',
  STOPS: 'nts_stops_v1',
  ROUTES: 'nts_routes_v1',
  DRIVERS: 'nts_drivers_v1',
  STUDENTS: 'nts_students_v1',
  POLLS: 'nts_polls_v1',
  VOTES: 'nts_votes_v1',
  BOARDING: 'nts_boarding_v1',
  NOTIFICATIONS: 'nts_notifications_v1',
  SESSION: 'nts_session_v1',
  INITIALIZED: 'nts_initialized_v1'
};

class NTSStorageManager {
  constructor() {
    this.init();
    this.setupStorageEventListener();
  }

  init() {
    // If not yet initialized or empty, seed initial demo data
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      this.resetToFactoryDefaults();
    }
  }

  // Cross-tab real-time sync handler
  setupStorageEventListener() {
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('nts_')) {
        // Dispatch in-window event so current page reactively re-renders
        window.dispatchEvent(new CustomEvent('nts:data-changed', {
          detail: { key: event.key, newValue: event.newValue }
        }));
      }
    });
  }

  _notifyChange(key, data) {
    // Notify same-window components
    window.dispatchEvent(new CustomEvent('nts:data-changed', {
      detail: { key, newValue: JSON.stringify(data) }
    }));
  }

  resetToFactoryDefaults() {
    localStorage.setItem(STORAGE_KEYS.BUSES, JSON.stringify(INITIAL_DEMO_DATA.buses));
    localStorage.setItem(STORAGE_KEYS.STOPS, JSON.stringify(INITIAL_DEMO_DATA.stops));
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(INITIAL_DEMO_DATA.routes));
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(INITIAL_DEMO_DATA.drivers));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_DEMO_DATA.students));
    localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(INITIAL_DEMO_DATA.polls));
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(INITIAL_DEMO_DATA.votes));
    localStorage.setItem(STORAGE_KEYS.BOARDING, JSON.stringify(INITIAL_DEMO_DATA.boardingRecords));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_DEMO_DATA.notifications));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    this._notifyChange('ALL', null);
  }

  /* ---------------- Buses ---------------- */
  // FUTURE BACKEND: GET /api/buses
  getBuses() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BUSES) || '[]');
    } catch {
      return INITIAL_DEMO_DATA.buses;
    }
  }

  // FUTURE BACKEND: POST/PUT /api/buses
  saveBuses(buses) {
    localStorage.setItem(STORAGE_KEYS.BUSES, JSON.stringify(buses));
    this._notifyChange(STORAGE_KEYS.BUSES, buses);
  }

  getBusById(busId) {
    return this.getBuses().find(b => b.id === busId);
  }

  updateBus(busId, updates) {
    const buses = this.getBuses();
    const index = buses.findIndex(b => b.id === busId);
    if (index !== -1) {
      buses[index] = { ...buses[index], ...updates, lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      this.saveBuses(buses);
      return buses[index];
    }
    return null;
  }

  /* ---------------- Stops ---------------- */
  // FUTURE BACKEND: GET /api/stops
  getStops() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.STOPS) || '[]');
    } catch {
      return INITIAL_DEMO_DATA.stops;
    }
  }

  // FUTURE BACKEND: POST/PUT /api/stops
  saveStops(stops) {
    localStorage.setItem(STORAGE_KEYS.STOPS, JSON.stringify(stops));
    this._notifyChange(STORAGE_KEYS.STOPS, stops);
  }

  getStopById(stopId) {
    return this.getStops().find(s => s.id === stopId);
  }

  /* ---------------- Routes ---------------- */
  // FUTURE BACKEND: GET /api/routes
  getRoutes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ROUTES) || '[]');
    } catch {
      return INITIAL_DEMO_DATA.routes;
    }
  }

  saveRoutes(routes) {
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
    this._notifyChange(STORAGE_KEYS.ROUTES, routes);
  }

  getRouteById(routeId) {
    return this.getRoutes().find(r => r.id === routeId);
  }

  /* ---------------- Drivers ---------------- */
  // FUTURE BACKEND: GET /api/drivers
  getDrivers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DRIVERS) || '[]');
    } catch {
      return INITIAL_DEMO_DATA.drivers;
    }
  }

  saveDrivers(drivers) {
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
    this._notifyChange(STORAGE_KEYS.DRIVERS, drivers);
  }

  getDriverById(driverId) {
    return this.getDrivers().find(d => d.id === driverId);
  }

  /* ---------------- Students ---------------- */
  // FUTURE BACKEND: GET /api/students
  getStudents() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
    } catch {
      return INITIAL_DEMO_DATA.students;
    }
  }

  saveStudents(students) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    this._notifyChange(STORAGE_KEYS.STUDENTS, students);
  }

  getStudentById(studentId) {
    return this.getStudents().find(s => s.id === studentId);
  }

  /* ---------------- Polls ---------------- */
  // FUTURE BACKEND: GET /api/polls
  getPolls() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.POLLS) || '{}');
    } catch {
      return INITIAL_DEMO_DATA.polls;
    }
  }

  savePolls(polls) {
    localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(polls));
    this._notifyChange(STORAGE_KEYS.POLLS, polls);
  }

  /* ---------------- Votes ---------------- */
  // FUTURE BACKEND: GET /api/votes
  getVotes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.VOTES) || '[]');
    } catch {
      return INITIAL_DEMO_DATA.votes;
    }
  }

  saveVotes(votes) {
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(votes));
    this._notifyChange(STORAGE_KEYS.VOTES, votes);
  }

  getStudentVote(studentId, journeyType = 'morning') {
    return this.getVotes().find(v => v.studentId === studentId && v.journeyType === journeyType);
  }

  /* ---------------- Boarding Records ---------------- */
  // FUTURE BACKEND: GET /api/boarding
  getBoardingRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOARDING) || '[]');
    } catch {
      return INITIAL_DEMO_DATA.boardingRecords;
    }
  }

  saveBoardingRecords(records) {
    localStorage.setItem(STORAGE_KEYS.BOARDING, JSON.stringify(records));
    this._notifyChange(STORAGE_KEYS.BOARDING, records);
  }

  getBoardingRecord(studentId, busId, journeyType = 'morning') {
    return this.getBoardingRecords().find(r => 
      r.studentId === studentId && 
      r.busId === busId && 
      r.journeyType === journeyType
    );
  }

  updateBoardingStatus(studentId, busId, stopId, journeyType, status, markedBy = 'system', reason = '') {
    const records = this.getBoardingRecords();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const existingIndex = records.findIndex(r => 
      r.studentId === studentId && 
      r.busId === busId && 
      r.journeyType === journeyType
    );

    if (existingIndex !== -1) {
      records[existingIndex] = {
        ...records[existingIndex],
        stopId,
        status,
        updatedAt: timeStr,
        markedBy,
        ...(reason ? { reason } : {})
      };
    } else {
      records.push({
        id: 'rec-' + Date.now() + '-' + Math.floor(Math.random()*1000),
        studentId,
        busId,
        stopId,
        journeyType,
        status,
        updatedAt: timeStr,
        markedBy,
        ...(reason ? { reason } : {})
      });
    }

    this.saveBoardingRecords(records);
    return records;
  }

  /* ---------------- Notifications ---------------- */
  // FUTURE BACKEND: GET /api/notifications
  getNotifications() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    } catch {
      return INITIAL_DEMO_DATA.notifications;
    }
  }

  saveNotifications(notifications) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    this._notifyChange(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  addNotification(notification) {
    const notifs = this.getNotifications();
    const newNotif = {
      id: 'notif-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      ...notification
    };
    notifs.unshift(newNotif);
    this.saveNotifications(notifs);
    return newNotif;
  }

  /* ---------------- Authentication Session ---------------- */
  // FUTURE BACKEND: Bearer JWT Token in HTTP Authorization Header
  getSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || 'null');
    } catch {
      return null;
    }
  }

  saveSession(session) {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
    this._notifyChange(STORAGE_KEYS.SESSION, session);
  }
}

export const storage = new NTSStorageManager();
