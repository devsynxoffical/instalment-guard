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

export const retailerService = {
  // Fetch all retailers
  async fetchRetailers() {
    try {
      const q = query(collection(db, 'retailers'), orderBy('businessName', 'asc'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      return list;
    } catch (error) {
      console.warn('Firestore Fetch Retailers Error:', error);
      return [];
    }
  },

  // Real-time listener for retailers
  subscribeRetailers(callback) {
    try {
      const q = query(collection(db, 'retailers'), orderBy('businessName', 'asc'));
      return onSnapshot(
        q,
        (snap) => {
          const list = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
          callback(list);
        },
        (error) => {
          console.warn('Retailers Subscription Warning:', error);
        }
      );
    } catch (error) {
      console.warn('Retailers Subscription Error:', error);
      return () => {};
    }
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
        credits: parseInt(data.initialCredits, 10) || 0,
        activeDevicesCount: 0,
        totalEnrolled: 0,
        totalSpent: (parseInt(data.initialCredits, 10) || 0) * 1000,
        status: data.status || 'ACTIVE',
        createdAt: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp(),
      };

      try {
        await fetch('http://localhost:5000/api/retailers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRetailer),
        });
      } catch (_) {}

      await setDoc(doc(db, 'retailers', retailerId), newRetailer);

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
      await runTransaction(db, async (transaction) => {
        const retailerRef = doc(db, 'retailers', retailerId);
        const retailerDoc = await transaction.get(retailerRef);

        if (!retailerDoc.exists()) {
          throw new Error('Retailer does not exist!');
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
      const retailerRef = doc(db, 'retailers', retailerId);
      await updateDoc(retailerRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

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
};
