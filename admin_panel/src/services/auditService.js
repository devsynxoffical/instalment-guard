import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const auditService = {
  // Add immutable security audit log
  async addLog({ performer, role, action, target, details, retailerId = null }) {
    try {
      const logId = `LOG-${Math.floor(10000 + Math.random() * 90000)}`;
      const logRef = doc(db, 'auditLogs', logId);

      const logData = {
        id: logId,
        logId,
        timestamp: new Date().toISOString(),
        performer: performer || 'System',
        role: role || 'SUPER_ADMIN',
        action: action || 'GENERAL_ACTION',
        target: target || 'N/A',
        details: details || '',
        retailerId,
        serverTime: serverTimestamp(),
      };

      await setDoc(logRef, logData);
      return logData;
    } catch (error) {
      console.warn('Add Audit Log Warning:', error);
      return null;
    }
  },

  // Fetch Audit Logs
  async fetchAuditLogs(retailerIdFilter = null) {
    try {
      let q = query(collection(db, 'auditLogs'), orderBy('serverTime', 'desc'));
      if (retailerIdFilter) {
        q = query(collection(db, 'auditLogs'), where('retailerId', '==', retailerIdFilter));
      }
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      return list;
    } catch (error) {
      console.warn('Fetch Audit Logs Error:', error);
      return [];
    }
  },

  // Subscribe to Audit Logs
  subscribeAuditLogs(retailerIdFilter, callback) {
    try {
      let q = query(collection(db, 'auditLogs'), orderBy('serverTime', 'desc'));
      if (retailerIdFilter) {
        q = query(collection(db, 'auditLogs'), where('retailerId', '==', retailerIdFilter));
      }
      return onSnapshot(
        q,
        (snap) => {
          const list = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
          callback(list);
        },
        (error) => {
          console.warn('Audit Logs Subscription Warning:', error);
        }
      );
    } catch (error) {
      console.warn('Audit Logs Subscription Error:', error);
      return () => {};
    }
  },
};
