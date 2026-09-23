import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { auditService } from './auditService';

const API_BASE_URL = 'http://localhost:5000/api';

export const deviceService = {
  // Determine online state based on lastSeen / lastCheckIn timestamp
  getOnlineStatus(lastSeenIso) {
    if (!lastSeenIso) return 'OFFLINE';
    const diffMs = Date.now() - new Date(lastSeenIso).getTime();
    const diffMins = diffMs / (1000 * 60);

    if (diffMins <= 5) return 'ONLINE';
    if (diffMins <= 20) return 'RECENTLY_ONLINE';
    return 'OFFLINE';
  },

  // Fetch devices from Node.js Live Backend (Strictly filtered by retailerId if set)
  async fetchDevices(retailerIdFilter = null) {
    try {
      const url = retailerIdFilter && retailerIdFilter !== 'SUPER_ADMIN_ALL'
        ? `${API_BASE_URL}/devices?retailerId=${encodeURIComponent(retailerIdFilter)}`
        : `${API_BASE_URL}/devices`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (error) {
      console.warn('Fetch Devices Node.js API Warning:', error.message);
    }
    return [];
  },

  // Real-time listener for devices via live polling
  subscribeDevices(retailerIdFilter, callback) {
    let active = true;
    const loadData = async () => {
      if (!active) return;
      const list = await this.fetchDevices(retailerIdFilter);
      callback(list);
    };

    loadData();
    const interval = setInterval(loadData, 3000); // 3-second live sync poll

    return () => {
      active = false;
      clearInterval(interval);
    };
  },

  // Enroll Device via Node.js Backend API
  async enrollDevice(enrollmentData, retailerId, performerName = 'Retailer', role = 'RETAILER') {
    try {
      const res = await fetch(`${API_BASE_URL}/devices/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentData, retailerId, performerName, role }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || 'Enrollment failed');
      }
      return json.data;
    } catch (error) {
      console.error('Enroll Device Error:', error);
      throw error;
    }
  },

  // Dispatch Remote Commands (RESTRICT_DEVICE, REMOVE_RESTRICTION, HIDE_APP, UNHIDE_APP, WIPE_DEVICE)
  async dispatchCommand(deviceId, commandType, unlockPin = '1234', lockMessage = '', performerName = 'Admin', role = 'ADMIN', retailerId = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/commands/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, commandType, unlockPin, lockMessage, performerName, role, retailerId }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || 'Command dispatch failed');
      }
      return json.data;
    } catch (error) {
      console.error('Dispatch Command Error:', error);
      throw error;
    }
  },

  // Customer Credit Check
  async checkCreditScore(cnic, phone = '') {
    try {
      const url = `${API_BASE_URL}/credit-check?cnic=${encodeURIComponent(cnic || '')}&phone=${encodeURIComponent(phone || '')}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (error) {
      console.warn('Credit check error:', error.message);
    }
    return null;
  },

  // Defaulter Search across all store records
  async checkDefaulter(queryStr, retailerName = '') {
    try {
      const url = `${API_BASE_URL}/defaulter-check?q=${encodeURIComponent(queryStr || '')}&retailerName=${encodeURIComponent(retailerName)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (error) {
      console.warn('Defaulter check error:', error.message);
    }
    return { isDefaulter: false, matches: [] };
  },

  // Create Appliance Contract (Multi-Appliance Finance Section)
  async createContract(contractData) {
    try {
      const res = await fetch(`${API_BASE_URL}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (error) {
      console.warn('Backend Contract Sync Warning:', error.message);
    }
    return contractData;
  },

  // Upload Contract Documents (Contract Picture & CNIC Photo)
  async uploadContractDocuments(contractId, contractImageUrl, cnicImageUrl) {
    try {
      const res = await fetch(`${API_BASE_URL}/contracts/upload-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, contractImageUrl, cnicImageUrl }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Document upload failed');
      return json.data;
    } catch (error) {
      console.error('Upload Contract Documents Error:', error);
      throw error;
    }
  },

  // Delete Device via Node.js Backend API
  async deleteDevice(deviceId, retailerId = null, performerName = 'Admin', role = 'ADMIN') {
    try {
      const res = await fetch(`${API_BASE_URL}/devices/${encodeURIComponent(deviceId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retailerId, performerName, role }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || 'Failed to delete device');
      }
      return json.data;
    } catch (error) {
      console.error('Delete Device Error:', error);
      throw error;
    }
  },
};
