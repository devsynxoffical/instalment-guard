import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const contractService = {
  // Fetch all contracts
  async fetchContracts(retailerIdFilter = null) {
    try {
      let q = query(collection(db, 'contracts'), orderBy('timestamp', 'desc'));
      if (retailerIdFilter) {
        q = query(collection(db, 'contracts'), where('retailerId', '==', retailerIdFilter));
      }
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ contractId: d.id, ...d.data() }));
      return list;
    } catch (error) {
      console.warn('Fetch Contracts Error:', error);
      return [];
    }
  },

  // Real-time listener for contracts
  subscribeContracts(retailerIdFilter, callback) {
    try {
      let q = query(collection(db, 'contracts'), orderBy('timestamp', 'desc'));
      if (retailerIdFilter) {
        q = query(collection(db, 'contracts'), where('retailerId', '==', retailerIdFilter));
      }
      return onSnapshot(
        q,
        (snap) => {
          const list = [];
          snap.forEach((d) => list.push({ contractId: d.id, ...d.data() }));
          callback(list);
        },
        (error) => {
          console.warn('Contracts Subscription Warning:', error);
        }
      );
    } catch (error) {
      console.warn('Contracts Subscription Error:', error);
      return () => {};
    }
  },

  // Fetch single contract by ID
  async getContractById(contractId) {
    try {
      const snap = await getDoc(doc(db, 'contracts', contractId));
      if (snap.exists()) {
        return { contractId: snap.id, ...snap.data() };
      }
      return null;
    } catch (error) {
      console.error('Get Contract By ID Error:', error);
      return null;
    }
  },
};
