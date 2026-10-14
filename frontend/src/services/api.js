const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';
export const BACKEND_URL = BASE_URL.replace('/api/v1', '');

function getHeaders(isMultipart = false) {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('hostelpulse_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res) {
  if (!res.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    const err = new Error(errorDetail);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async register(userData) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Complaints
  async listComplaints(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const url = `${BASE_URL}/complaints?${query.toString()}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getComplaint(id) {
    const res = await fetch(`${BASE_URL}/complaints/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createComplaint(formData) {
    // formData is FormData object with fields + optional image file
    const res = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse(res);
  },

  async updateStatus(id, { status, notes, hold_reason }) {
    const res = await fetch(`${BASE_URL}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, notes, hold_reason })
    });
    return handleResponse(res);
  },

  async assignStaff(id, { assigned_staff_id, target_resolution_date, notes }) {
    const res = await fetch(`${BASE_URL}/complaints/${id}/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ assigned_staff_id, target_resolution_date, notes })
    });
    return handleResponse(res);
  },

  async overridePriority(id, { priority, reason }) {
    const res = await fetch(`${BASE_URL}/complaints/${id}/priority-override`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ priority, reason })
    });
    return handleResponse(res);
  },

  async resolveComplaint(id, { resolution_notes }) {
    const res = await fetch(`${BASE_URL}/complaints/${id}/resolve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ resolution_notes })
    });
    return handleResponse(res);
  },

  async reopenComplaint(id, { reason }) {
    const res = await fetch(`${BASE_URL}/complaints/${id}/reopen`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse(res);
  },

  async addComment(id, { message, is_internal = false }) {
    const res = await fetch(`${BASE_URL}/complaints/${id}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, is_internal })
    });
    return handleResponse(res);
  },

  // Notifications
  async listNotifications() {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getUnreadCount() {
    const res = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async markNotificationRead(id) {
    const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Analytics
  async getDashboardMetrics() {
    const res = await fetch(`${BASE_URL}/analytics/dashboard`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getRecurringIssues() {
    const res = await fetch(`${BASE_URL}/analytics/recurring`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async scanRecurringIssues() {
    const res = await fetch(`${BASE_URL}/analytics/scan-recurring`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Users & Staff
  async getStaff() {
    const res = await fetch(`${BASE_URL}/users/staff`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async listUsers() {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createStaff(staffData) {
    const res = await fetch(`${BASE_URL}/users/staff`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(staffData)
    });
    return handleResponse(res);
  },

  // File URL helper
  resolveImageUrl(path) {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${BACKEND_URL}${path}`;
  }
};
