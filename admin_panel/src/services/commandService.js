import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { auditService } from './auditService';
import { API_BASE_URL } from '../config/api';

const BACKEND_API = `${API_BASE_URL}/api`;

export const commandService = {
  // Dispatch Command to Node.js Live Backend Engine
  async dispatchCommand(
    deviceId,
    commandType,
    unlockPin = '1234',
    lockMessage = '',
    performerName = 'Admin',
    role = 'ADMIN',
    retailerId = null
  ) {
    try {
      const res = await fetch(`${BACKEND_API}/commands/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          commandType,
          unlockPin,
          lockMessage,
          performerName,
          role,
          retailerId,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || 'Command dispatch failed');
      }
      return json.command || json.data;
    } catch (error) {
      console.error('Dispatch Command Error:', error);
      throw error;
    }
  },

  // Fetch command history for a device
  async fetchCommandHistory(deviceId) {
    try {
      const q = query(
        collection(db, 'deviceCommands'),
        where('deviceId', '==', deviceId),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      return list;
    } catch (error) {
      console.warn('Fetch Command History Error:', error);
      return [];
    }
  },

  // Real-time listener for command history
  subscribeCommandHistory(deviceId, callback) {
    try {
      const q = query(
        collection(db, 'deviceCommands'),
        where('deviceId', '==', deviceId),
        orderBy('timestamp', 'desc')
      );
      return onSnapshot(
        q,
        (snap) => {
          const list = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
          callback(list);
        },
        (error) => {
          console.warn('Command History Subscription Warning:', error);
        }
      );
    } catch (error) {
      console.warn('Command History Subscription Error:', error);
      return () => {};
    }
  },
};
