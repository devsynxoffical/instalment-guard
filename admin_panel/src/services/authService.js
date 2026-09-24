import { API_BASE_URL } from '../config/api';

const API_BASE = `${API_BASE_URL}/api/auth`;

export const authService = {
  // Login with Database Backend
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      // Store JWT token and user profile in localStorage
      localStorage.setItem('ig_auth_token', data.token);
      localStorage.setItem('ig_demo_auth', JSON.stringify(data.user));

      return { user: data.user, token: data.token };
    } catch (error) {
      console.error('Login Error:', error.message);
      throw error;
    }
  },

  // Register New Retailer Account
  async register(registrationData) {
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      if (data.token) {
        localStorage.setItem('ig_auth_token', data.token);
        localStorage.setItem('ig_demo_auth', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Registration Error:', error.message);
      throw error;
    }
  },

  // Get Current Authenticated Profile from Server
  async getCurrentProfile() {
    const token = localStorage.getItem('ig_auth_token');
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        this.logout();
        return null;
      }

      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('ig_demo_auth', JSON.stringify(data.user));
        return data.user;
      }
      return null;
    } catch (e) {
      console.warn('Failed to verify user session with server:', e.message);
      // Fallback to local storage if offline
      try {
        const saved = localStorage.getItem('ig_demo_auth');
        return saved ? JSON.parse(saved) : null;
      } catch (_) {
        return null;
      }
    }
  },

  // Change Password
  async changePassword(userId, currentPassword, newPassword) {
    const token = localStorage.getItem('ig_auth_token');
    const res = await fetch(`${API_BASE}/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to update password.');
    }
    return data;
  },

  // Logout
  logout() {
    localStorage.removeItem('ig_auth_token');
    localStorage.removeItem('ig_demo_auth');
    return Promise.resolve();
  },

  // Auth state listener
  onAuthChange(callback) {
    const checkAuth = async () => {
      const user = await this.getCurrentProfile();
      callback({ user, profile: user });
    };
    checkAuth();
    return () => {};
  },
};

