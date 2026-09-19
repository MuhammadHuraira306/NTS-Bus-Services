/**
 * NTS Travel Services - Home & Authentication Controller
 */

import { storage } from './storage.js';
import { NTSAuth, DEMO_CREDENTIALS } from './auth.js';
import { $, $$, showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, show current session banner
  const user = NTSAuth.getCurrentUser();
  const sessionBanner = $('#existing-session-banner');
  if (user && sessionBanner) {
    sessionBanner.innerHTML = `
      <div class="alert alert-info" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          You are currently signed in as <strong>${user.name}</strong> (${user.role.toUpperCase()}).
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="${user.role === 'admin' ? 'admin.html' : user.role === 'driver' ? 'driver.html' : 'student.html'}" class="btn btn-primary btn-sm">
            Enter My Portal →
          </a>
          <button id="btn-logout-home" class="btn btn-outline btn-sm">Log Out</button>
        </div>
      </div>
    `;

    $('#btn-logout-home')?.addEventListener('click', () => {
      NTSAuth.logout();
      window.location.reload();
    });
  }

  // 1-Click Quick Login Buttons
  $$('.btn-quick-login').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const role = e.currentTarget.dataset.role;
      const res = NTSAuth.quickLogin(role);
      if (res.success) {
        showToast('Signed In', `Signed in as ${res.user.name} (${res.user.role})`, 'success');
        setTimeout(() => {
          window.location.href = res.redirect;
        }, 300);
      } else {
        showToast('Login Failed', res.error, 'danger');
      }
    });
  });

  // Standard Login Form
  const loginForm = $('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#login-email').value;
      const password = $('#login-password').value;

      const res = NTSAuth.login(email, password);
      if (res.success) {
        showToast('Login Successful', `Welcome, ${res.user.name}!`, 'success');
        setTimeout(() => {
          window.location.href = res.redirect;
        }, 300);
      } else {
        showToast('Login Error', res.error, 'danger');
      }
    });
  }

  // Preset Credentials Helper Clicks
  $$('.preset-cred-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      const email = e.currentTarget.dataset.email;
      const password = e.currentTarget.dataset.password;
      if ($('#login-email')) $('#login-email').value = email;
      if ($('#login-password')) $('#login-password').value = password;
      showToast('Credentials Filled', `Filled demo credentials for ${email}`, 'info');
    });
  });

  // Reset Demo Data Button
  $('#btn-reset-data')?.addEventListener('click', () => {
    if (confirm('Reset all demo data (buses, votes, boarding status) back to fresh factory defaults?')) {
      storage.resetAllData();
      showToast('Data Reset', 'All simulation data has been reset to defaults.', 'success');
      setTimeout(() => window.location.reload(), 500);
    }
  });

  // Populate live landing statistics
  const buses = storage.getBuses();
  const students = storage.getStudents();
  const polls = storage.getPolls();

  if ($('#landing-stat-buses')) $('#landing-stat-buses').textContent = `${buses.filter(b => b.status === 'Active').length} Active`;
  if ($('#landing-stat-students')) $('#landing-stat-students').textContent = `${students.length} Enrolled`;
  if ($('#landing-stat-poll')) $('#landing-stat-poll').textContent = `${polls.morning.status || 'Open'}`;
});
