import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const SAMPLE_RETAILERS = [
  {
    id: 'RET-101',
    businessName: 'Mobile Zone Saddar',
    ownerName: 'Tariq Mahmood',
    email: 'tariq.saddar@mobilezone.pk',
    phone: '+92 300 1234567',
    city: 'Karachi',
    address: 'Shop 42, Star City Mall, Saddar',
    credits: 25,
    activeDevicesCount: 18,
    totalEnrolled: 22,
    totalSpent: 220000,
    status: 'ACTIVE',
    createdAt: '2026-07-10',
  },
  {
    id: 'RET-102',
    businessName: 'Galaxy Mobile Hafeez Center',
    ownerName: 'Kamran Ali',
    email: 'kamran@galaxymobile.pk',
    phone: '+92 321 9876543',
    city: 'Lahore',
    address: 'Hall 3, Hafeez Center, Gulberg III',
    credits: 10,
    activeDevicesCount: 35,
    totalEnrolled: 40,
    totalSpent: 400000,
    status: 'ACTIVE',
    createdAt: '2026-06-15',
  },
  {
    id: 'RET-103',
    businessName: 'Al-Madina Traders',
    ownerName: 'Usman Farooq',
    email: 'usman@almadinatraders.pk',
    phone: '+92 333 4567890',
    city: 'Rawalpindi',
    address: 'Plaza 9, Raja Bazaar',
    credits: 0,
    activeDevicesCount: 12,
    totalEnrolled: 15,
    totalSpent: 150000,
    status: 'SUSPENDED',
    createdAt: '2026-08-01',
  },
];

const SAMPLE_DEVICES = [
  {
    deviceId: 'DEV-RMX3830-88',
    retailerId: 'RET-101',
    retailerName: 'Mobile Zone Saddar',
    contractId: 'CTR-2026-9001',
    customerName: 'Muhammad Hamza',
    customerPhone: '+92 300 8877665',
    manufacturer: 'Realme',
    brand: 'Realme',
    model: 'RMX3830 (C53)',
    hardware: 'qcom',
    androidVersion: '14.0',
    sdkVersion: 34,
    securityPatch: '2026-08-01',
    imei: '864293048571029',
    ipAddress: '192.168.10.45',
    connectionType: 'Wi-Fi',
    batteryLevel: 84,
    isCharging: true,
    totalRamMb: 6144,
    availRamMb: 2840,
    totalStorageGb: '128.00',
    availStorageGb: '54.20',
    resolution: '1080 x 2400',
    densityDpi: 420,
    uptimeSeconds: 14200,
    latitude: 31.5204,
    longitude: 74.3587,
    isManagedDevice: true,
    isDeviceOwner: true,
    isRestricted: false,
    deviceStatus: 'ACTIVE',
    lastCheckIn: new Date(Date.now() - 3 * 60000).toISOString(),
    createdAt: '2026-08-10',
  },
  {
    deviceId: 'DEV-SAM-A54-99',
    retailerId: 'RET-102',
    retailerName: 'Galaxy Mobile Hafeez Center',
    contractId: 'CTR-2026-9002',
    customerName: 'Bilal Ahmed',
    customerPhone: '+92 321 4433221',
    manufacturer: 'Samsung',
    brand: 'Samsung',
    model: 'Galaxy A54 5G',
    hardware: 'exynos1380',
    androidVersion: '14.0',
    sdkVersion: 34,
    securityPatch: '2026-08-01',
    imei: '354892019482710',
    ipAddress: '10.0.2.15',
    connectionType: 'Cellular (5G)',
    batteryLevel: 29,
    isCharging: false,
    totalRamMb: 8192,
    availRamMb: 1950,
    totalStorageGb: '256.00',
    availStorageGb: '112.50',
    resolution: '1080 x 2340',
    densityDpi: 450,
    uptimeSeconds: 38900,
    latitude: 24.8607,
    longitude: 67.0011,
    isManagedDevice: true,
    isDeviceOwner: true,
    isRestricted: true,
    deviceStatus: 'RESTRICTED',
    lastCheckIn: new Date(Date.now() - 15 * 60000).toISOString(),
    createdAt: '2026-08-12',
  },
  {
    deviceId: 'DEV-XIA-NOTE13-05',
    retailerId: 'RET-101',
    retailerName: 'Mobile Zone Saddar',
    contractId: 'CTR-2026-9003',
    customerName: 'Zubair Hassan',
    customerPhone: '+92 333 1122334',
    manufacturer: 'Xiaomi',
    brand: 'Redmi',
    model: 'Note 13 Pro',
    hardware: 'mt6877',
    androidVersion: '14.0',
    sdkVersion: 34,
    securityPatch: '2026-07-01',
    imei: '869102948571023',
    ipAddress: '192.168.1.109',
    connectionType: 'Wi-Fi',
    batteryLevel: 95,
    isCharging: true,
    totalRamMb: 8192,
    availRamMb: 4100,
    totalStorageGb: '256.00',
    availStorageGb: '180.10',
    resolution: '1220 x 2712',
    densityDpi: 440,
    uptimeSeconds: 8400,
    latitude: 33.6844,
    longitude: 73.0479,
    isManagedDevice: true,
    isDeviceOwner: true,
    isRestricted: false,
    deviceStatus: 'ACTIVE',
    lastCheckIn: new Date(Date.now() - 1 * 60000).toISOString(),
    createdAt: '2026-08-20',
  },
];

const SAMPLE_CONTRACTS = [
  {
    contractId: 'CTR-2026-9001',
    customerName: 'Muhammad Hamza',
    customerCnic: '42101-9876543-1',
    customerPhone: '+92 300 8877665',
    deviceId: 'DEV-RMX3830-88',
    deviceModel: 'Realme RMX3830 (C53)',
    retailerId: 'RET-101',
    totalPrice: 45000,
    downPayment: 10000,
    remainingBalance: 35000,
    monthlyInstallment: 5000,
    dueDateDay: 10,
    nextDueDate: '2026-10-10',
    paidMonths: 2,
    totalMonths: 9,
    status: 'ACTIVE',
  },
  {
    contractId: 'CTR-2026-9002',
    customerName: 'Bilal Ahmed',
    customerCnic: '35202-1234567-3',
    customerPhone: '+92 321 4433221',
    deviceId: 'DEV-SAM-A54-99',
    deviceModel: 'Samsung Galaxy A54 5G',
    retailerId: 'RET-102',
    totalPrice: 115000,
    downPayment: 25000,
    remainingBalance: 90000,
    monthlyInstallment: 10000,
    dueDateDay: 5,
    nextDueDate: '2026-09-05',
    paidMonths: 2,
    totalMonths: 11,
    status: 'RESTRICTED',
  },
  {
    contractId: 'CTR-2026-9003',
    customerName: 'Zubair Hassan',
    customerCnic: '37405-5544332-9',
    customerPhone: '+92 333 1122334',
    deviceId: 'DEV-XIA-NOTE13-05',
    deviceModel: 'Xiaomi Redmi Note 13 Pro',
    retailerId: 'RET-101',
    totalPrice: 75000,
    downPayment: 15000,
    remainingBalance: 60000,
    monthlyInstallment: 7500,
    dueDateDay: 15,
    nextDueDate: '2026-09-15',
    paidMonths: 1,
    totalMonths: 9,
    status: 'ACTIVE',
  },
];

const SAMPLE_NOTIFICATIONS = [
  {
    id: 'NOTIF-01',
    title: 'Overdue Installment Alert',
    message: 'Contract CTR-2026-9002 (Bilal Ahmed) is overdue by 9 days.',
    type: 'WARNING',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'NOTIF-02',
    title: 'Low Credit Balance',
    message: 'Al-Madina Traders has 0 credits remaining.',
    type: 'ALERT',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'NOTIF-03',
    title: 'Device Lock Command Executed',
    message: 'DEV-SAM-A54-99 restriction overlay activated successfully.',
    type: 'INFO',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

export const seedService = {
  async seedDemoFirestoreData() {
    try {
      const batch = writeBatch(db);

      // Seed Retailers
      SAMPLE_RETAILERS.forEach((r) => {
        batch.set(doc(db, 'retailers', r.id), { ...r, timestamp: serverTimestamp() });
      });

      // Seed Devices
      SAMPLE_DEVICES.forEach((d) => {
        batch.set(doc(db, 'devices', d.deviceId), { ...d, timestamp: serverTimestamp() });
      });

      // Seed Contracts
      SAMPLE_CONTRACTS.forEach((c) => {
        batch.set(doc(db, 'contracts', c.contractId), { ...c, timestamp: serverTimestamp() });
      });

      // Seed Notifications
      SAMPLE_NOTIFICATIONS.forEach((n) => {
        batch.set(doc(db, 'notifications', n.id), n);
      });

      await batch.commit();
      console.log('Successfully seeded Firestore Demo Data.');
      return true;
    } catch (error) {
      console.error('Seed Demo Data Error:', error);
      throw error;
    }
  },
};
