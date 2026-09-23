import {
  collection,
  doc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const notificationService = {
  // Fetch Notifications
  async fetchNotifications() {
    try {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      return list;
    } catch (error) {
      console.warn('Fetch Notifications Warning:', error);
      return [];
    }
  },

  // Subscribe to Notifications
  subscribeNotifications(callback) {
    try {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snap) => {
          const list = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
          callback(list);
        },
        (error) => {
          console.warn('Notifications Subscription Warning:', error);
        }
      );
    } catch (error) {
      console.warn('Notifications Subscription Error:', error);
      return () => {};
    }
  },

  // Mark notification as read
  async markAsRead(id) {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      console.warn('Mark Notification Read Error:', error);
    }
  },

  // Mark all notifications as read
  async markAllAsRead(notifications = []) {
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.isRead) {
          batch.update(doc(db, 'notifications', n.id), { isRead: true });
        }
      });
      await batch.commit();
    } catch (error) {
      console.warn('Mark All Notifications Read Error:', error);
    }
  },
};
