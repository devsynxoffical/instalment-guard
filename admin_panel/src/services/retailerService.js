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
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { auditService } from './auditService';
import { API_BASE_URL } from '../config/api';

const BACKEND_API = `${API_BASE_URL}/api`;

export const retailerService = {
  // Fetch all retailers
  async fetchRetailers() {
    try {
      const res = await fetch(`${BACKEND_API}/retailers`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (_) {}

    try {
      if (db) {
        const q = query(collection(db, 'retailers'), orderBy('businessName', 'asc'));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        return list;
      }
    } catch (error) {
      console.warn('Firestore Fetch Retailers Error:', error);
    }
    return [];
  },

  // Real-time listener for retailers with Node.js backend fallback
  subscribeRetailers(callback) {
    let isSubscribed = true;

    // 1. Initial and recurring poll against Node.js Live Backend
    const pollBackend = async () => {
      try {
        const res = await fetch(`${BACKEND_API}/retailers`);
        if (res.ok && isSubscribed) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            callback(json.data);
          }
        }
      } catch (_) {}
    };

    pollBackend();
    const intervalId = setInterval(pollBackend, 5000);

    // 2. Also listen via Firestore if db is active
    let unsubFirestore = () => {};
    try {
      if (db) {
        const q = query(collection(db, 'retailers'), orderBy('businessName', 'asc'));
        unsubFirestore = onSnapshot(
          q,
          (snap) => {
            if (!isSubscribed) return;
            const list = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
            if (list.length > 0) callback(list);
          },
          () => {}
        );
      }
    } catch (_) {}

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
      unsubFirestore();
    };
  },

  // Create new Retailer
  async createRetailer(data, performerName = 'Super Admin') {
    try {
      const retailerId = data.id || `RET-${Math.floor(100 + Math.random() * 900)}`;
      const newRetailer = {
        id: retailerId,
        businessName: data.businessName,
        ownerName: data.ownerName,
        email: data.email,
        phone: data.phone,
        address: data.address || '',
        city: data.city,
        credits: parseInt(data.initialCredits || data.credits, 10) || 0,
        activeDevicesCount: 0,
        totalEnrolled: 0,
        totalSpent: (parseInt(data.initialCredits || data.credits, 10) || 0) * 1000,
        status: data.status || 'ACTIVE',
        password: data.password || data.initialPassword || 'Retailer@12345',
        createdAt: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp(),
      };

      try {
        await fetch(`${BACKEND_API}/retailers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRetailer),
        });
      } catch (_) {}

      if (db) {
        try {
          await setDoc(doc(db, 'retailers', retailerId), newRetailer);
        } catch (_) {}
      }

      // Audit Log
      await auditService.addLog({
        performer: performerName,
        role: 'SUPER_ADMIN',
        action: 'CREATE_RETAILER',
        target: `${data.businessName} (${retailerId})`,
        details: `Created new retailer account in ${data.city} with ${data.initialCredits} credits.`,
      });

      return newRetailer;
    } catch (error) {
      console.error('Create Retailer Error:', error);
      throw error;
    }
  },

  // Allocate Credits (Atomic Transaction)
  async allocateCredits(retailerId, count, reason = 'Super Admin Allocation', performerName = 'Super Admin') {
    try {
      try {
        await fetch(`${BACKEND_API}/retailers/${encodeURIComponent(retailerId)}/credits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: count, reason, performer: performerName }),
        });
      } catch (_) {}

      if (db) {
        try {
          await runTransaction(db, async (transaction) => {
            const retailerRef = doc(db, 'retailers', retailerId);
            const retailerDoc = await transaction.get(retailerRef);

            if (!retailerDoc.exists()) {
              return;
            }

            const currentCredits = retailerDoc.data().credits || 0;
            const newBalance = currentCredits + count;
            const currentSpent = retailerDoc.data().totalSpent || 0;

            transaction.update(retailerRef, {
              credits: newBalance,
              totalSpent: currentSpent + count * 1000,
              updatedAt: serverTimestamp(),
            });

            // Credit transaction document
            const txRef = doc(collection(db, 'creditTransactions'));
            transaction.set(txRef, {
              txId: txRef.id,
              retailerId,
              type: 'ALLOCATED',
              amount: count,
              balanceBefore: currentCredits,
              balanceAfter: newBalance,
              reason,
              createdBy: performerName,
              createdAt: serverTimestamp(),
            });
          });
        } catch (_) {}
      }

      // Audit Log
      await auditService.addLog({
        performer: performerName,
        role: 'SUPER_ADMIN',
        action: 'CREDITS_ALLOCATED',
        target: retailerId,
        details: `Allocated +${count} credits. Reason: ${reason}`,
      });

      return true;
    } catch (error) {
      console.error('Allocate Credits Error:', error);
      throw error;
    }
  },

  // Toggle Retailer Status (Activate / Suspend)
  async toggleRetailerStatus(retailerId, newStatus, performerName = 'Super Admin') {
    try {
      try {
        await fetch(`${BACKEND_API}/retailers/${encodeURIComponent(retailerId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (_) {}

      if (db) {
        try {
          const retailerRef = doc(db, 'retailers', retailerId);
          await updateDoc(retailerRef, {
            status: newStatus,
            updatedAt: serverTimestamp(),
          });
        } catch (_) {}
      }

      await auditService.addLog({
        performer: performerName,
        role: 'SUPER_ADMIN',
        action: 'UPDATE_RETAILER_STATUS',
        target: retailerId,
        details: `Status changed to ${newStatus}`,
      });

      return newStatus;
    } catch (error) {
      console.error('Toggle Retailer Status Error:', error);
      throw error;
    }
  },

  // Delete Retailer
  async deleteRetailer(retailerId, performerName = 'Super Admin') {
    try {
      try {
        await fetch(`${BACKEND_API}/retailers/${encodeURIComponent(retailerId)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ performerName }),
        });
      } catch (_) {}

      return true;
    } catch (error) {
      console.error('Delete Retailer Error:', error);
      throw error;
    }
  },
};
