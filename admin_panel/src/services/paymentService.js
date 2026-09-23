import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { auditService } from './auditService';

export const paymentService = {
  // Record Customer Payment (Atomic Transaction)
  async recordPayment(
    contractId,
    amount,
    method = 'Cash',
    reference = '',
    performerName = 'Admin',
    role = 'RETAILER'
  ) {
    try {
      let updatedContract = null;
      let paymentRecord = null;

      await runTransaction(db, async (transaction) => {
        const contractRef = doc(db, 'contracts', contractId);
        const contractSnap = await transaction.get(contractRef);

        if (!contractSnap.exists()) {
          throw new Error(`Contract ${contractId} not found.`);
        }

        const contract = contractSnap.data();
        const payAmount = parseFloat(amount) || 0;
        const newRemaining = Math.max(0, (contract.remainingBalance || 0) - payAmount);
        const newPaidMonths = (contract.paidMonths || 0) + 1;
        const newStatus = newRemaining === 0 ? 'COMPLETED' : 'ACTIVE';

        // Update Contract Document
        transaction.update(contractRef, {
          remainingBalance: newRemaining,
          paidMonths: newPaidMonths,
          status: newStatus,
          updatedAt: serverTimestamp(),
        });

        // Update Device Status if applicable
        if (contract.deviceId) {
          const devRef = doc(db, 'devices', contract.deviceId);
          const devSnap = await transaction.get(devRef);
          if (devSnap.exists()) {
            transaction.update(devRef, {
              isRestricted: false,
              deviceStatus: newStatus === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE',
              updatedAt: serverTimestamp(),
            });
          }
        }

        // Create Payment Document
        const paymentRef = doc(collection(db, 'payments'));
        paymentRecord = {
          paymentId: paymentRef.id,
          contractId,
          customerName: contract.customerName || 'Customer',
          retailerId: contract.retailerId || '',
          amount: payAmount,
          method,
          reference: reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
          paymentDate: new Date().toISOString(),
          recordedBy: performerName,
          createdAt: serverTimestamp(),
        };

        transaction.set(paymentRef, paymentRecord);
        updatedContract = { ...contract, remainingBalance: newRemaining, status: newStatus };
      });

      // Audit Log
      await auditService.addLog({
        performer: performerName,
        role,
        action: 'RECORD_PAYMENT',
        target: `${contractId} (${updatedContract.customerName})`,
        details: `Received payment of Rs. ${amount} via ${method}. Remaining Balance: Rs. ${updatedContract.remainingBalance}`,
      });

      return paymentRecord;
    } catch (error) {
      console.error('Record Payment Error:', error);
      throw error;
    }
  },

  // Fetch Payments History
  async fetchPayments(retailerIdFilter = null) {
    try {
      let q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
      if (retailerIdFilter) {
        q = query(collection(db, 'payments'), where('retailerId', '==', retailerIdFilter));
      }
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ paymentId: d.id, ...d.data() }));
      return list;
    } catch (error) {
      console.warn('Fetch Payments Error:', error);
      return [];
    }
  },

  // Real-time listener for Payments
  subscribePayments(retailerIdFilter, callback) {
    try {
      let q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
      if (retailerIdFilter) {
        q = query(collection(db, 'payments'), where('retailerId', '==', retailerIdFilter));
      }
      return onSnapshot(
        q,
        (snap) => {
          const list = [];
          snap.forEach((d) => list.push({ paymentId: d.id, ...d.data() }));
          callback(list);
        },
        (error) => {
          console.warn('Payments Subscription Warning:', error);
        }
      );
    } catch (error) {
      console.warn('Payments Subscription Error:', error);
      return () => {};
    }
  },
};
