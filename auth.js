/**
 * NTS Travel Services - Authentication & Session Management
 *
 * SECURITY NOTICE:
 * This is a frontend prototype. Authentication and authorization must be implemented
 * server-side before production deployment (e.g. OAuth 2.0, JWT tokens, bcrypt
 * password hashing, rate-limiting, and secure HTTP-only cookies).
 * Do not store real passwords or sensitive student records in LocalStorage.
 */

import { storage } from './storage.js';
import { showToast } from './utils.js';

export const DEMO_CREDENTIALS = {
  ADMIN: {
    email: 'admin@nts.local',
    password: 'admin123',
    role: 'admin',
    name: 'Engr. Zafar Iqbal',
    title: 'Director of Transport, NUST / NTS'
  },
  DRIVER: {
    email: 'driver@nts.local',
    password: 'driver123',
    role: 'driver',
    driverId: 'drv-01',
    busId: 'bus-01',
    name: 'Muhammad Ali',
    phone: '+92 300 5123456'
  },
  STUDENT: {
    email: 'student@nts.local',
    password: 'student123',
    role: 'student',
    studentId: 'stu-01',
    universityId: 'NUST-2022-CS-101',
    name: 'Hamza Malik',
    phone: '+92 333 1112233',
    department: 'SEECS - Computer Science'
  }
};

export class NTSAuth {
  static bootstrapDemoSessionFromUrl() {
    const role = new URLSearchParams(window.location.search).get('demo');
    if (!role || this.isAuthenticated()) return;
    const credentials = role === 'admin' ? DEMO_CREDENTIALS.ADMIN : role === 'driver' ? DEMO_CREDENTIALS.DRIVER : role === 'student' ? DEMO_CREDENTIALS.STUDENT : null;
    if (credentials) {
      this.login(credentials.email, credentials.password);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  static getCurrentUser() {
    return storage.getSession();
  }

  static isAuthenticated() {
    return !!this.getCurrentUser();
  }

  static login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();

    // Check Admin
    if (cleanEmail === DEMO_CREDENTIALS.ADMIN.email && password === DEMO_CREDENTIALS.ADMIN.password) {
      const session = {
        role: 'admin',
        email: cleanEmail,
        name: DEMO_CREDENTIALS.ADMIN.name,
        title: DEMO_CREDENTIALS.ADMIN.title
      };
      storage.saveSession(session);
      return { success: true, user: session, redirect: 'admin.html' };
    }

    // Check Driver
    if (cleanEmail === DEMO_CREDENTIALS.DRIVER.email && password === DEMO_CREDENTIALS.DRIVER.password) {
      const session = {
        role: 'driver',
        email: cleanEmail,
        name: DEMO_CREDENTIALS.DRIVER.name,
        driverId: DEMO_CREDENTIALS.DRIVER.driverId,
        busId: DEMO_CREDENTIALS.DRIVER.busId,
        phone: DEMO_CREDENTIALS.DRIVER.phone
      };
      storage.saveSession(session);
      return { success: true, user: session, redirect: 'driver.html' };
    }

    // Check Student
    if (cleanEmail === DEMO_CREDENTIALS.STUDENT.email && password === DEMO_CREDENTIALS.STUDENT.password) {
      const session = {
        role: 'student',
        email: cleanEmail,
        name: DEMO_CREDENTIALS.STUDENT.name,
        studentId: DEMO_CREDENTIALS.STUDENT.studentId,
        universityId: DEMO_CREDENTIALS.STUDENT.universityId,
        phone: DEMO_CREDENTIALS.STUDENT.phone,
        department: DEMO_CREDENTIALS.STUDENT.department
      };
      storage.saveSession(session);
      return { success: true, user: session, redirect: 'student.html' };
    }

    // Check registered students in storage
    const allStudents = storage.getStudents();
    const matchedStudent = allStudents.find(s => s.email.toLowerCase() === cleanEmail);
    if (matchedStudent && password === 'student123') {
      const session = {
        role: 'student',
        email: matchedStudent.email,
        name: matchedStudent.name,
        studentId: matchedStudent.id,
        universityId: matchedStudent.studentId,
        phone: matchedStudent.phone,
        department: matchedStudent.department
      };
      storage.saveSession(session);
      return { success: true, user: session, redirect: 'student.html' };
    }

    return { success: false, error: 'Invalid email or password. Please use demo credentials.' };
  }

  static quickLogin(role) {
    if (role === 'admin') {
      return this.login(DEMO_CREDENTIALS.ADMIN.email, DEMO_CREDENTIALS.ADMIN.password);
    } else if (role === 'driver') {
      return this.login(DEMO_CREDENTIALS.DRIVER.email, DEMO_CREDENTIALS.DRIVER.password);
    } else if (role === 'student') {
      return this.login(DEMO_CREDENTIALS.STUDENT.email, DEMO_CREDENTIALS.STUDENT.password);
    }
    return { success: false, error: 'Unknown role' };
  }

  static logout() {
    storage.saveSession(null);
    showToast('Logged Out', 'You have been signed out of NTS Travel Services.', 'info');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 400);
  }

  static checkRouteAccess(allowedRole) {
    this.bootstrapDemoSessionFromUrl();
    const user = this.getCurrentUser();
    if (!user) {
      // Not logged in
      window.location.href = 'index.html?login_required=1';
      return false;
    }
    if (allowedRole && user.role !== allowedRole) {
      // Redirect to authorized portal
      if (user.role === 'admin') window.location.href = 'admin.html';
      else if (user.role === 'driver') window.location.href = 'driver.html';
      else if (user.role === 'student') window.location.href = 'student.html';
      return false;
    }
    return true;
  }
}
