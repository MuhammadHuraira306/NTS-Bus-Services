/**
 * NTS Travel Services - Notification Engine
 * Browser Notification API + In-App Notification Center
 *
 * FUTURE BACKEND:
 * In production, integrate Firebase Cloud Messaging (FCM) or Web Push API
 * with VAPID keys for background push notifications even when the browser tab is closed.
 */

import { storage } from './storage.js';
import { showToast, escapeHtml } from './utils.js';

export class NTSNotificationManager {
  static init() {
    this.requestPermission();
  }

  static async requestPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (e) {
          console.warn('Notification permission request ignored/blocked:', e);
        }
      }
    }
  }

  /**
   * Dispatch a notification both in-app and to browser system tray if permitted
   */
  static notify(title, message, options = {}) {
    const { userId = 'all', type = 'info', actions = [] } = options;

    // 1. Record to Storage Log
    const record = storage.addNotification({
      userId,
      title,
      message,
      type,
      actions
    });

    // 2. In-App Toast
    showToast(title, message, type === 'arrival' ? 'warning' : type === 'success' ? 'success' : 'info', 6000);

    // 3. Native Browser Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/public/favicon.ico',
          tag: 'nts-' + Date.now(),
          badge: '/public/favicon.ico'
        });
      } catch (err) {
        console.warn('System notification failed:', err);
      }
    }

    return record;
  }

  /**
   * Render notifications dropdown or list for current user
   */
  static renderNotificationList(containerEl, currentUserId = 'all') {
    if (!containerEl) return;
    const allNotifs = storage.getNotifications();
    const userNotifs = allNotifs.filter(n => n.userId === 'all' || n.userId === currentUserId);

    if (userNotifs.length === 0) {
      containerEl.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted);">
          <p>No notifications yet</p>
        </div>
      `;
      return;
    }

    containerEl.innerHTML = userNotifs.map(n => `
      <div class="notification-item ${n.isRead ? 'read' : 'unread'}" style="padding: 12px 14px; border-bottom: 1px solid var(--border-color); display: flex; gap: 10px; align-items: flex-start;">
        <div style="font-size: 1.25rem;">
          ${n.type === 'arrival' ? '🚌' : n.type === 'danger' ? '⚠️' : '🔔'}
        </div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${escapeHtml(n.title)}</h4>
            <span style="font-size: 0.72rem; color: var(--text-light);">${escapeHtml(n.timestamp)}</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.35;">${escapeHtml(n.message)}</p>
        </div>
      </div>
    `).join('');
  }

  static getUnreadCount(currentUserId = 'all') {
    const allNotifs = storage.getNotifications();
    return allNotifs.filter(n => (n.userId === 'all' || n.userId === currentUserId) && !n.isRead).length;
  }

  static markAllAsRead(currentUserId = 'all') {
    const allNotifs = storage.getNotifications();
    allNotifs.forEach(n => {
      if (n.userId === 'all' || n.userId === currentUserId) {
        n.isRead = true;
      }
    });
    storage.saveNotifications(allNotifs);
  }
}
