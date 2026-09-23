import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const telemetryService = {
  // Fetch telemetry for a device
  async fetchTelemetry(deviceId) {
    try {
      const snap = await getDoc(doc(db, 'deviceTelemetry', deviceId));
      if (snap.exists()) {
        return { deviceId: snap.id, ...snap.data() };
      }
      return null;
    } catch (error) {
      console.warn('Fetch Telemetry Error:', error);
      return null;
    }
  },

  // Subscribe to telemetry updates
  subscribeTelemetry(deviceId, callback) {
    try {
      return onSnapshot(
        doc(db, 'deviceTelemetry', deviceId),
        (snap) => {
          if (snap.exists()) {
            callback({ deviceId: snap.id, ...snap.data() });
          } else {
            callback(null);
          }
        },
        (error) => {
          console.warn('Telemetry Subscription Warning:', error);
        }
      );
    } catch (error) {
      console.warn('Telemetry Subscription Error:', error);
      return () => {};
    }
  },
};
