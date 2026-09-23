// Production Admin Data Store for Installment Guard Admin Panel

const INITIAL_RETAILERS = [];
const INITIAL_DEVICES = [];
const INITIAL_CONTRACTS = [];
const INITIAL_AUDIT_LOGS = [];

class AdminDataService {
  constructor() {
    this.retailers = this.loadData('ig_admin_retailers', INITIAL_RETAILERS);
    this.devices = this.loadData('ig_admin_devices', INITIAL_DEVICES);
    this.contracts = this.loadData('ig_admin_contracts', INITIAL_CONTRACTS);
    this.auditLogs = this.loadData('ig_admin_logs', INITIAL_AUDIT_LOGS);
    this.superAdminCredits = 1000;
  }

  loadData(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  saveData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  getRetailers() {
    return [...this.retailers];
  }

  getDevices(retailerIdFilter = null) {
    if (retailerIdFilter) {
      return this.devices.filter((d) => d.retailerId === retailerIdFilter);
    }
    return [...this.devices];
  }

  getContracts(retailerIdFilter = null) {
    if (retailerIdFilter) {
      return this.contracts.filter((c) => c.retailerId === retailerIdFilter);
    }
    return [...this.contracts];
  }

  getAuditLogs() {
    return [...this.auditLogs];
  }

  allocateCreditsToRetailer(retailerId, count, superAdminName = 'Super Admin') {
    const idx = this.retailers.findIndex((r) => r.id === retailerId);
    if (idx !== -1) {
      this.retailers[idx].credits += count;
      this.retailers[idx].totalSpent += count * 1000; // 1000 PKR per credit
      this.saveData('ig_admin_retailers', this.retailers);

      this.addAuditLog(
        superAdminName,
        'SUPER_ADMIN',
        'CREDITS_ALLOCATED',
        `${this.retailers[idx].businessName} (${retailerId})`,
        `Allocated +${count} credits (Total: ${this.retailers[idx].credits})`
      );
      return true;
    }
    return false;
  }

  toggleRetailerStatus(retailerId) {
    const idx = this.retailers.findIndex((r) => r.id === retailerId);
    if (idx !== -1) {
      const newStatus = this.retailers[idx].status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      this.retailers[idx].status = newStatus;
      this.saveData('ig_admin_retailers', this.retailers);

      this.addAuditLog(
        'Super Admin',
        'SUPER_ADMIN',
        'RETAILER_STATUS_CHANGED',
        `${this.retailers[idx].businessName}`,
        `Status changed to ${newStatus}`
      );
      return newStatus;
    }
    return null;
  }

  enrollNewDevice(enrollmentData, retailerId) {
    const retailer = this.retailers.find((r) => r.id === retailerId);
    if (retailer && retailer.credits < 1) {
      throw new Error('Insufficient Credits! Please purchase credits from Super Admin.');
    }

    if (retailer) {
      retailer.credits -= 1;
      retailer.activeDevicesCount += 1;
      retailer.totalEnrolled += 1;
      this.saveData('ig_admin_retailers', this.retailers);
    }

    const deviceId = `DEV-${enrollmentData.model.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const contractId = `CTR-2026-${Math.floor(9000 + Math.random() * 900)}`;

    const newDevice = {
      deviceId,
      retailerId,
      retailerName: retailer ? retailer.businessName : 'Retailer',
      contractId,
      customerName: enrollmentData.customerName,
      customerPhone: enrollmentData.customerPhone,
      manufacturer: enrollmentData.manufacturer || 'Android',
      brand: enrollmentData.brand || 'Generic',
      model: enrollmentData.model,
      hardware: 'octa-core',
      androidVersion: '14.0',
      sdkVersion: 34,
      securityPatch: '2026-08-01',
      imei: enrollmentData.imei || '359102948571009',
      ipAddress: '192.168.1.55',
      connectionType: 'Wi-Fi',
      batteryLevel: 90,
      isCharging: false,
      totalRamMb: 6144,
      availRamMb: 3100,
      totalStorageGb: '128.00',
      availStorageGb: '78.50',
      resolution: '1080 x 2400',
      densityDpi: 420,
      uptimeSeconds: 1200,
      latitude: 31.5204,
      longitude: 74.3587,
      isManagedDevice: true,
      isDeviceOwner: true,
      isRestricted: false,
      deviceStatus: 'ACTIVE',
      lastCheckIn: new Date().toISOString(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    const newContract = {
      contractId,
      customerName: enrollmentData.customerName,
      customerCnic: enrollmentData.customerCnic || '42101-0000000-1',
      customerPhone: enrollmentData.customerPhone,
      deviceId,
      deviceModel: enrollmentData.model,
      retailerId,
      totalPrice: parseFloat(enrollmentData.totalPrice) || 50000,
      downPayment: parseFloat(enrollmentData.downPayment) || 10000,
      remainingBalance: (parseFloat(enrollmentData.totalPrice) || 50000) - (parseFloat(enrollmentData.downPayment) || 10000),
      monthlyInstallment: parseFloat(enrollmentData.monthlyInstallment) || 5000,
      dueDateDay: 10,
      nextDueDate: '2026-10-10',
      paidMonths: 0,
      totalMonths: 8,
      status: 'ACTIVE',
    };

    this.devices.unshift(newDevice);
    this.contracts.unshift(newContract);
    this.saveData('ig_admin_devices', this.devices);
    this.saveData('ig_admin_contracts', this.contracts);

    this.addAuditLog(
      retailer ? retailer.businessName : 'Retailer',
      'RETAILER',
      'DEVICE_ENROLLED',
      `${deviceId} (${contractId})`,
      `Enrolled ${enrollmentData.model} for ${enrollmentData.customerName}. 1 Credit Consumed.`
    );

    return { newDevice, newContract };
  }

  dispatchCommand(deviceId, commandType, performerName, role) {
    const devIdx = this.devices.findIndex((d) => d.deviceId === deviceId);
    if (devIdx === -1) return false;

    const dev = this.devices[devIdx];
    let actionDesc = '';

    if (commandType === 'RESTRICT_DEVICE') {
      dev.isRestricted = true;
      dev.deviceStatus = 'RESTRICTED';
      actionDesc = 'Triggered Overdue Lock Task & Red Restriction Overlay';

      const cIdx = this.contracts.findIndex((c) => c.contractId === dev.contractId);
      if (cIdx !== -1) this.contracts[cIdx].status = 'RESTRICTED';
    } else if (commandType === 'REMOVE_RESTRICTION') {
      dev.isRestricted = false;
      dev.deviceStatus = 'ACTIVE';
      actionDesc = 'Cleared Lock Task & Restored Full Device Access';

      const cIdx = this.contracts.findIndex((c) => c.contractId === dev.contractId);
      if (cIdx !== -1) this.contracts[cIdx].status = 'ACTIVE';
    } else if (commandType === 'SYNC_DEVICE') {
      dev.lastCheckIn = new Date().toISOString();
      actionDesc = 'Forced live telemetry & status check-in sync';
    } else if (commandType === 'HIDE_APP') {
      actionDesc = 'Executed Launcher Component Hiding (App Icon Hidden)';
    } else if (commandType === 'UNHIDE_APP') {
      actionDesc = 'Restored App Launcher Component (App Icon Visible)';
    }

    dev.lastCheckIn = new Date().toISOString();
    this.saveData('ig_admin_devices', this.devices);
    this.saveData('ig_admin_contracts', this.contracts);

    this.addAuditLog(performerName, role, commandType, `${dev.deviceId} (${dev.model})`, actionDesc);
    return true;
  }

  recordPayment(contractId, amount, performerName) {
    const cIdx = this.contracts.findIndex((c) => c.contractId === contractId);
    if (cIdx === -1) return false;

    const contract = this.contracts[cIdx];
    contract.remainingBalance = Math.max(0, contract.remainingBalance - amount);
    contract.paidMonths += 1;

    if (contract.remainingBalance === 0) {
      contract.status = 'COMPLETED';
    } else {
      contract.status = 'ACTIVE';
    }

    const devIdx = this.devices.findIndex((d) => d.deviceId === contract.deviceId);
    if (devIdx !== -1) {
      this.devices[devIdx].isRestricted = false;
      this.devices[devIdx].deviceStatus = contract.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE';
      this.saveData('ig_admin_devices', this.devices);
    }

    this.saveData('ig_admin_contracts', this.contracts);

    this.addAuditLog(
      performerName,
      'ADMIN',
      'PAYMENT_RECORDED',
      `${contractId} (${contract.customerName})`,
      `Received payment of Rs. ${amount}. Remaining: Rs. ${contract.remainingBalance}`
    );
    return true;
  }

  addAuditLog(performer, role, action, target, details) {
    const newLog = {
      id: `LOG-${Math.floor(8000 + Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      performer,
      role,
      action,
      target,
      details,
    };
    this.auditLogs.unshift(newLog);
    this.saveData('ig_admin_logs', this.auditLogs);
  }
}

export const adminDataService = new AdminDataService();
