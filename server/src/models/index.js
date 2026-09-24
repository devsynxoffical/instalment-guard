import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const UserModel = sequelize.define('User', {
  id: { type: DataTypes.STRING, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, defaultValue: '' },
  role: { type: DataTypes.STRING, defaultValue: 'RETAILER' }, // 'SUPER_ADMIN' | 'RETAILER'
  retailerId: { type: DataTypes.STRING, defaultValue: null },
  status: { type: DataTypes.STRING, defaultValue: 'ACTIVE' }, // 'ACTIVE' | 'SUSPENDED'
  phone: { type: DataTypes.STRING, defaultValue: '' },
}, { timestamps: true });

export const RetailerModel = sequelize.define('Retailer', {
  id: { type: DataTypes.STRING, primaryKey: true },
  businessName: { type: DataTypes.STRING, allowNull: false },
  ownerName: { type: DataTypes.STRING, defaultValue: '' },
  email: { type: DataTypes.STRING, defaultValue: '' },
  phone: { type: DataTypes.STRING, defaultValue: '' },
  city: { type: DataTypes.STRING, defaultValue: 'Lahore' },
  address: { type: DataTypes.TEXT, defaultValue: '' },
  credits: { type: DataTypes.INTEGER, defaultValue: 0 },
  activeDevicesCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalEnrolled: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'ACTIVE' },
  totalSpent: { type: DataTypes.FLOAT, defaultValue: 0 },
}, { timestamps: true });

export const DeviceModel = sequelize.define('Device', {
  deviceId: { type: DataTypes.STRING, primaryKey: true },
  physicalDeviceId: { type: DataTypes.STRING, defaultValue: null },
  retailerId: { type: DataTypes.STRING, allowNull: false },
  retailerName: { type: DataTypes.STRING, defaultValue: '' },
  retailerPhone: { type: DataTypes.STRING, defaultValue: '' },
  retailerAddress: { type: DataTypes.TEXT, defaultValue: '' },
  contractId: { type: DataTypes.STRING, defaultValue: '' },
  customerName: { type: DataTypes.STRING, defaultValue: 'Enrolled Customer' },
  customerPhone: { type: DataTypes.STRING, defaultValue: '' },
  customerCnic: { type: DataTypes.STRING, defaultValue: '' },
  manufacturer: { type: DataTypes.STRING, defaultValue: null },
  brand: { type: DataTypes.STRING, defaultValue: null },
  model: { type: DataTypes.STRING, defaultValue: 'Device' },
  hardware: { type: DataTypes.STRING, defaultValue: null },
  androidVersion: { type: DataTypes.STRING, defaultValue: null },
  sdkVersion: { type: DataTypes.INTEGER, defaultValue: null },
  securityPatch: { type: DataTypes.STRING, defaultValue: null },
  imei: { type: DataTypes.STRING, defaultValue: '' },
  ipAddress: { type: DataTypes.STRING, defaultValue: null },
  connectionType: { type: DataTypes.STRING, defaultValue: null },
  batteryLevel: { type: DataTypes.INTEGER, defaultValue: null },
  isCharging: { type: DataTypes.BOOLEAN, defaultValue: false },
  totalRamMb: { type: DataTypes.INTEGER, defaultValue: null },
  availRamMb: { type: DataTypes.INTEGER, defaultValue: null },
  totalStorageGb: { type: DataTypes.STRING, defaultValue: null },
  availStorageGb: { type: DataTypes.STRING, defaultValue: null },
  resolution: { type: DataTypes.STRING, defaultValue: null },
  densityDpi: { type: DataTypes.INTEGER, defaultValue: null },
  uptimeSeconds: { type: DataTypes.INTEGER, defaultValue: null },
  latitude: { type: DataTypes.FLOAT, defaultValue: null },
  longitude: { type: DataTypes.FLOAT, defaultValue: null },
  isManagedDevice: { type: DataTypes.BOOLEAN, defaultValue: true },
  isDeviceOwner: { type: DataTypes.BOOLEAN, defaultValue: true },
  isRestricted: { type: DataTypes.BOOLEAN, defaultValue: false },
  isAppHidden: { type: DataTypes.BOOLEAN, defaultValue: false },
  unlockPin: { type: DataTypes.STRING, defaultValue: '1234' },
  deviceStatus: { type: DataTypes.STRING, defaultValue: 'ACTIVE' },
  lastCheckIn: { type: DataTypes.STRING, defaultValue: '' },
}, { timestamps: true });

export const ContractModel = sequelize.define('Contract', {
  contractId: { type: DataTypes.STRING, primaryKey: true },
  customerId: { type: DataTypes.STRING, defaultValue: '' },
  customerName: { type: DataTypes.STRING, defaultValue: '' },
  customerCnic: { type: DataTypes.STRING, defaultValue: '' },
  customerPhone: { type: DataTypes.STRING, defaultValue: '' },
  deviceId: { type: DataTypes.STRING, defaultValue: '' },
  deviceModel: { type: DataTypes.STRING, defaultValue: 'Device' },
  assetCategory: { type: DataTypes.STRING, defaultValue: 'MOBILE_PHONE' },
  serialNumber: { type: DataTypes.STRING, defaultValue: 'N/A' },
  retailerId: { type: DataTypes.STRING, defaultValue: 'RET-101' },
  totalPrice: { type: DataTypes.FLOAT, defaultValue: 60000 },
  downPayment: { type: DataTypes.FLOAT, defaultValue: 15000 },
  remainingBalance: { type: DataTypes.FLOAT, defaultValue: 45000 },
  monthlyInstallment: { type: DataTypes.FLOAT, defaultValue: 5000 },
  dueDateDay: { type: DataTypes.INTEGER, defaultValue: 10 },
  nextDueDate: { type: DataTypes.STRING, defaultValue: '2026-10-10' },
  paidMonths: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalMonths: { type: DataTypes.INTEGER, defaultValue: 12 },
  status: { type: DataTypes.STRING, defaultValue: 'ACTIVE' },
  contractImageUrl: { type: DataTypes.TEXT, defaultValue: null },
  cnicImageUrl: { type: DataTypes.TEXT, defaultValue: null },
  notes: { type: DataTypes.TEXT, defaultValue: '' },
}, { timestamps: true });

export const AdminCommandModel = sequelize.define('AdminCommand', {
  commandId: { type: DataTypes.STRING, primaryKey: true },
  deviceId: { type: DataTypes.STRING, allowNull: false },
  retailerId: { type: DataTypes.STRING, defaultValue: 'RET-101' },
  commandType: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'PENDING' },
  payload: { type: DataTypes.JSON, defaultValue: {} },
  failureReason: { type: DataTypes.TEXT, defaultValue: null },
  executedAt: { type: DataTypes.STRING, defaultValue: null },
}, { timestamps: true });

export const AuditLogModel = sequelize.define('AuditLog', {
  id: { type: DataTypes.STRING, primaryKey: true },
  timestamp: { type: DataTypes.STRING, defaultValue: '' },
  performer: { type: DataTypes.STRING, defaultValue: 'System' },
  role: { type: DataTypes.STRING, defaultValue: 'ADMIN' },
  action: { type: DataTypes.STRING, defaultValue: '' },
  target: { type: DataTypes.STRING, defaultValue: '' },
  details: { type: DataTypes.TEXT, defaultValue: '' },
}, { timestamps: true });

export const BleRelayModel = sequelize.define('BleRelay', {
  id: { type: DataTypes.STRING, primaryKey: true },
  timestamp: { type: DataTypes.STRING, defaultValue: '' },
  offlineDeviceId: { type: DataTypes.STRING, defaultValue: '' },
  relayedByDeviceId: { type: DataTypes.STRING, defaultValue: '' },
  latitude: { type: DataTypes.FLOAT, defaultValue: 0 },
  longitude: { type: DataTypes.FLOAT, defaultValue: 0 },
  rssi: { type: DataTypes.INTEGER, defaultValue: -70 },
}, { timestamps: true });
