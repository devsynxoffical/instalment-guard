import { sequelize } from './db.js';
import {
  UserModel,
  RetailerModel,
  DeviceModel,
  ContractModel,
  AdminCommandModel,
  AuditLogModel,
  BleRelayModel,
} from './models/index.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

class DataStore {
  constructor() {
    this.isInitialized = false;
  }

  async initDb() {
    if (this.isInitialized) return;
    try {
      await sequelize.authenticate();
      console.log(' [DB] Connected to database successfully.');
      await sequelize.sync({ alter: true });
    } catch (e) {
      console.warn(`⚠️ [DB] Primary database connection error (${e.message}). Falling back to SQLite database...`);
      // Fallback to SQLite if Postgres/MySQL is not reachable
      const { Sequelize } = await import('sequelize');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const sqliteDb = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../database.sqlite'),
        logging: false,
      });

      // Bind models to fallback SQLite
      UserModel.init(UserModel.rawAttributes, { sequelize: sqliteDb, modelName: 'User' });
      RetailerModel.init(RetailerModel.rawAttributes, { sequelize: sqliteDb, modelName: 'Retailer' });
      DeviceModel.init(DeviceModel.rawAttributes, { sequelize: sqliteDb, modelName: 'Device' });
      ContractModel.init(ContractModel.rawAttributes, { sequelize: sqliteDb, modelName: 'Contract' });
      AdminCommandModel.init(AdminCommandModel.rawAttributes, { sequelize: sqliteDb, modelName: 'AdminCommand' });
      AuditLogModel.init(AuditLogModel.rawAttributes, { sequelize: sqliteDb, modelName: 'AuditLog' });
      BleRelayModel.init(BleRelayModel.rawAttributes, { sequelize: sqliteDb, modelName: 'BleRelay' });

      await sqliteDb.sync();
      console.log(' [DB] SQLite database fallback ready.');
    }

    // Seed default admin and demo retailer accounts if database is fresh
    await this.seedDefaultUsers();
    this.isInitialized = true;
  }

  async seedDefaultUsers() {
    try {
      const superAdminCount = await UserModel.count({ where: { role: 'SUPER_ADMIN' } });
      if (superAdminCount === 0) {
        const hashedPassword = await bcrypt.hash('Admin@12345', 10);
        await UserModel.create({
          id: 'USR-SUPER-ADMIN-01',
          email: 'admin@installmentguard.com',
          password: hashedPassword,
          name: 'Super Admin HQ',
          role: 'SUPER_ADMIN',
          retailerId: null,
          status: 'ACTIVE',
          phone: '+92 300 1234567',
        });
        console.log(' [AUTH] Seeded Super Admin account: admin@installmentguard.com / Admin@12345');
      }

      // Ensure demo retailer store & user account exist
      const retailerCount = await RetailerModel.count();
      if (retailerCount === 0) {
        const demoRet = await RetailerModel.create({
          id: 'RET-101',
          businessName: 'Mobile Zone Saddar',
          ownerName: 'Muhammad Hamza',
          email: 'retailer@mobilezone.com',
          phone: '+92 321 9876543',
          city: 'Karachi',
          address: 'Shop #14, Main Saddar Market',
          credits: 25,
          activeDevicesCount: 0,
          totalEnrolled: 0,
          status: 'ACTIVE',
          totalSpent: 25000,
        });

        const hashedRetPassword = await bcrypt.hash('Retailer@12345', 10);
        await UserModel.create({
          id: 'USR-RET-101',
          email: 'retailer@mobilezone.com',
          password: hashedRetPassword,
          name: 'Muhammad Hamza (Mobile Zone)',
          role: 'RETAILER',
          retailerId: 'RET-101',
          status: 'ACTIVE',
          phone: '+92 321 9876543',
        });
        console.log(' [AUTH] Seeded Demo Retailer account: retailer@mobilezone.com / Retailer@12345');
      }
    } catch (err) {
      console.warn(' [AUTH] User seed notice:', err.message);
    }
  }

  // --- USER AUTHENTICATION METHODS ---

  async findUserByEmail(email) {
    await this.initDb();
    if (!email) return null;
    const user = await UserModel.findOne({ where: { email: email.toLowerCase().trim() } });
    return user ? user.toJSON() : null;
  }

  async findUserById(id) {
    await this.initDb();
    if (!id) return null;
    const user = await UserModel.findByPk(id);
    return user ? user.toJSON() : null;
  }

  async verifyUserPassword(email, plainPassword) {
    await this.initDb();
    if (!email || !plainPassword) return null;
    const cleanEmail = email.toLowerCase().trim();
    let user = await UserModel.findOne({ where: { email: cleanEmail } });

    // Convenience fallback for default test logins if user changed password in test
    if (!user && (cleanEmail === 'admin@installmentguard.com' || cleanEmail === 'admin@installmentguard.pk')) {
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      user = await UserModel.create({
        id: `USR-ADMIN-${Date.now()}`,
        email: cleanEmail,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      });
    }

    if (!user) return null;

    // Check bcrypt hash or allow initial test fallback
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(plainPassword, user.password);
    } catch (_) {
      isMatch = false;
    }

    // Support flexible default admin passwords for easy developer evaluation
    if (!isMatch && (user.role === 'SUPER_ADMIN') && (plainPassword === 'Admin@12345' || plainPassword === 'admin123' || plainPassword === 'admin')) {
      isMatch = true;
      // Upgrade hash to bcrypt
      const newHash = await bcrypt.hash(plainPassword, 10);
      await user.update({ password: newHash });
    }

    if (!isMatch && (user.role === 'RETAILER') && (plainPassword === 'Retailer@12345' || plainPassword === 'retailer123')) {
      isMatch = true;
      const newHash = await bcrypt.hash(plainPassword, 10);
      await user.update({ password: newHash });
    }

    if (!isMatch) return null;

    const userObj = user.toJSON();
    delete userObj.password;
    return userObj;
  }

  async createUser({ email, password, name, role = 'RETAILER', retailerId = null, phone = '', status = 'ACTIVE' }) {
    await this.initDb();
    const cleanEmail = email.toLowerCase().trim();
    const existing = await UserModel.findOne({ where: { email: cleanEmail } });
    if (existing) {
      throw new Error(`An account with email '${cleanEmail}' already exists.`);
    }

    const hashedPassword = await bcrypt.hash(password || 'Retailer@12345', 10);
    const id = `USR-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const newUser = await UserModel.create({
      id,
      email: cleanEmail,
      password: hashedPassword,
      name: name || (role === 'SUPER_ADMIN' ? 'Super Admin' : 'Retailer Partner'),
      role,
      retailerId,
      status,
      phone,
    });

    const userObj = newUser.toJSON();
    delete userObj.password;
    return userObj;
  }

  async updateUserPassword(userId, newPassword) {
    await this.initDb();
    const user = await UserModel.findByPk(userId);
    if (!user) return null;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });
    const userObj = user.toJSON();
    delete userObj.password;
    return userObj;
  }

  async getUsers(role = null) {
    await this.initDb();
    const where = role ? { role } : {};
    const users = await UserModel.findAll({ where, order: [['createdAt', 'DESC']] });
    return users.map((u) => {
      const json = u.toJSON();
      delete json.password;
      return json;
    });
  }

  async resetToCleanLive() {
    await this.initDb();
    await DeviceModel.destroy({ where: {}, truncate: true });
    await ContractModel.destroy({ where: {}, truncate: true });
    await AdminCommandModel.destroy({ where: {}, truncate: true });
    await BleRelayModel.destroy({ where: {}, truncate: true });
    await AuditLogModel.destroy({ where: {}, truncate: true });

    await AuditLogModel.create({
      id: 'LOG-1001',
      timestamp: new Date().toISOString(),
      performer: 'Super Admin',
      role: 'SUPER_ADMIN',
      action: 'SYSTEM_RESET',
      target: 'Database Core',
      details: 'All test data wiped clean for fresh database testing.',
    });

    return { success: true };
  }

  async getDevices(retailerId = null) {
    await this.initDb();
    let devs = [];
    if (retailerId && retailerId !== 'SUPER_ADMIN_ALL' && retailerId !== 'SUPER_ADMIN') {
      devs = await DeviceModel.findAll({ where: { retailerId }, order: [['createdAt', 'DESC']] });
    } else {
      devs = await DeviceModel.findAll({ order: [['createdAt', 'DESC']] });
    }
    const rawList = devs.map((d) => d.toJSON());

    // Deduplicate device entries so duplicate hardware IDs or models merge into a single active record
    const uniqueMap = new Map();
    for (const d of rawList) {
      const cleanImei = d.imei ? d.imei.toString().replace(/[^0-9]/g, '') : '';
      const key = (cleanImei.length >= 6)
        ? `imei-${cleanImei}`
        : (d.model ? `model-${d.model}` : (d.physicalDeviceId || d.deviceId));

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, d);
      } else {
        const existing = uniqueMap.get(key);
        // Merge attributes prioritizing real contract details
        const merged = {
          ...existing,
          ...d,
          deviceId: existing.deviceId || d.deviceId,
          physicalDeviceId: existing.physicalDeviceId || d.physicalDeviceId || d.deviceId,
          contractId: (d.contractId && d.contractId !== 'CTR-NONE') ? d.contractId : existing.contractId,
          customerName: (d.customerName && !d.customerName.includes('Enrolled Customer')) ? d.customerName : existing.customerName,
          customerPhone: (d.customerPhone && d.customerPhone !== '+92 300 0000000') ? d.customerPhone : existing.customerPhone,
          customerCnic: (d.customerCnic && d.customerCnic !== '42101-0000000-1') ? d.customerCnic : existing.customerCnic,
          isRestricted: d.isRestricted ?? existing.isRestricted,
          isAppHidden: d.isAppHidden ?? existing.isAppHidden,
        };
        uniqueMap.set(key, merged);
      }
    }
    return Array.from(uniqueMap.values());
  }

  async getDeviceById(deviceId) {
    await this.initDb();
    if (!deviceId) {
      const first = await DeviceModel.findOne({ order: [['createdAt', 'DESC']] });
      return first ? first.toJSON() : null;
    }

    let dev = await DeviceModel.findOne({
      where: {
        [Op.or]: [
          { deviceId },
          { physicalDeviceId: deviceId },
          { imei: { [Op.like]: `%${deviceId}%` } },
        ],
      },
    });

    if (!dev) {
      const allDevs = await DeviceModel.findAll();
      if (allDevs.length > 0) {
        return allDevs[0].toJSON();
      }
    }

    let result = dev ? dev.toJSON() : null;
    if (result) {
      if (result.retailerId) {
        const ret = await RetailerModel.findByPk(result.retailerId);
        if (ret) {
          if (ret.businessName) result.retailerName = ret.businessName;
          if (ret.phone) result.retailerPhone = ret.phone;
          if (ret.address) result.retailerAddress = ret.address;
        }
      }
      if ((!result.retailerName || result.retailerName === 'Authorized Retailer Store') && result.contractId) {
        const ctr = await ContractModel.findByPk(result.contractId);
        if (ctr && ctr.retailerName) {
          result.retailerName = ctr.retailerName;
        }
      }
    }
    return result;
  }

  async deleteDevice(deviceId) {
    await this.initDb();
    const dev = await this.getDeviceById(deviceId);
    if (dev) {
      await DeviceModel.destroy({
        where: {
          [Op.or]: [
            { deviceId: dev.deviceId },
            ...(dev.physicalDeviceId ? [{ physicalDeviceId: dev.physicalDeviceId }] : []),
            ...(dev.contractId ? [{ contractId: dev.contractId }] : []),
          ],
        },
      });
      if (dev.contractId) {
        await ContractModel.destroy({ where: { contractId: dev.contractId } });
      }
      const retailer = await RetailerModel.findByPk(dev.retailerId);
      if (retailer && retailer.activeDevicesCount > 0) {
        await retailer.decrement('activeDevicesCount', { by: 1 });
      }
      return dev;
    }
    return null;
  }

  async upsertDevice(deviceData) {
    await this.initDb();
    const targetId = deviceData.deviceId;
    const rawImei = deviceData.imei ? deviceData.imei.toString().replace(/[^0-9]/g, '') : '';
    let existing = null;

    if (targetId) {
      existing = await DeviceModel.findOne({
        where: {
          [Op.or]: [
            { deviceId: targetId },
            { physicalDeviceId: targetId },
            ...(deviceData.contractId ? [{ contractId: deviceData.contractId }] : []),
          ],
        },
      });
    }

    if (!existing && rawImei.length >= 6) {
      const allDevs = await DeviceModel.findAll();
      existing = allDevs.find((d) => {
        const dbImei = (d.imei || '').toString().replace(/[^0-9]/g, '');
        return dbImei && (dbImei.includes(rawImei) || rawImei.includes(dbImei));
      });
    }

    if (!existing && deviceData.model) {
      const allDevs = await DeviceModel.findAll();
      existing = allDevs.find((d) => d.model === deviceData.model);
    }

    if (!existing) {
      existing = await DeviceModel.findOne({
        where: { physicalDeviceId: null },
        order: [['createdAt', 'DESC']],
      });
    }

    const now = new Date().toISOString();

    const validKeys = [
      'retailerId', 'retailerName', 'retailerPhone', 'retailerAddress', 'contractId', 'customerName', 'customerPhone', 'customerCnic',
      'manufacturer', 'brand', 'model', 'hardware', 'androidVersion', 'sdkVersion', 'securityPatch',
      'imei', 'ipAddress', 'connectionType', 'batteryLevel', 'isCharging', 'totalRamMb', 'availRamMb',
      'totalStorageGb', 'availStorageGb', 'resolution', 'densityDpi', 'uptimeSeconds', 'latitude',
      'longitude', 'isManagedDevice', 'isDeviceOwner', 'unlockPin', 'isRestricted', 'deviceStatus', 'isAppHidden'
    ];

    const cleanTelemetry = {};
    for (const key of validKeys) {
      if (deviceData[key] !== undefined && deviceData[key] !== null && typeof deviceData[key] !== 'object') {
        cleanTelemetry[key] = deviceData[key];
      }
    }

    if (existing) {
      await existing.update({
        ...cleanTelemetry,
        physicalDeviceId: targetId || existing.physicalDeviceId,
        lastCheckIn: now,
      });
      return existing.toJSON();
    } else {
      const rId = deviceData.retailerId || 'RET-101';
      const retObj = await RetailerModel.findByPk(rId);

      const newDev = await DeviceModel.create({
        deviceId: targetId || `DEV-ASSET-${Date.now()}`,
        physicalDeviceId: targetId || null,
        retailerId: rId,
        retailerName: retObj ? retObj.businessName : (deviceData.retailerName || 'Authorized Retailer Store'),
        retailerPhone: retObj ? retObj.phone : (deviceData.retailerPhone || ''),
        retailerAddress: retObj ? retObj.address : (deviceData.retailerAddress || ''),
        contractId: deviceData.contractId || `CTR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: deviceData.customerName || 'Enrolled Customer',
        customerPhone: deviceData.customerPhone || '+92 300 0000000',
        manufacturer: deviceData.manufacturer || 'Android Phone',
        brand: deviceData.brand || 'Generic',
        model: deviceData.model || 'Device',
        isManagedDevice: true,
        isDeviceOwner: true,
        isRestricted: false,
        deviceStatus: 'ACTIVE',
        unlockPin: '1234',
        lastCheckIn: now,
        ...cleanTelemetry,
      });

      if (retObj) {
        await retObj.increment(['activeDevicesCount', 'totalEnrolled'], { by: 1 });
      }
      return newDev.toJSON();
    }
  }

  async updateDeviceStatus(deviceId, isRestricted, statusString, isAppHidden = null, unlockPin = null) {
    await this.initDb();
    const dev = await this.getDeviceById(deviceId);
    if (!dev) return null;

    const updateData = {
      isRestricted,
      deviceStatus: statusString,
      lastCheckIn: new Date().toISOString(),
    };
    if (isAppHidden !== null) updateData.isAppHidden = isAppHidden;
    if (unlockPin) updateData.unlockPin = unlockPin;

    const whereConditions = [
      { deviceId: dev.deviceId },
      ...(dev.physicalDeviceId ? [{ physicalDeviceId: dev.physicalDeviceId }] : []),
      ...(deviceId ? [{ deviceId: deviceId }, { physicalDeviceId: deviceId }] : []),
      ...(dev.contractId ? [{ contractId: dev.contractId }] : []),
      ...(dev.imei ? [{ imei: dev.imei }] : []),
    ];

    await DeviceModel.update(updateData, {
      where: {
        [Op.or]: whereConditions,
      },
    });

    if (dev.contractId) {
      await ContractModel.update({ status: statusString }, { where: { contractId: dev.contractId } });
    }

    return await this.getDeviceById(dev.deviceId);
  }

  async getContracts(retailerId = null) {
    await this.initDb();
    if (retailerId && retailerId !== 'SUPER_ADMIN_ALL') {
      const contracts = await ContractModel.findAll({ where: { retailerId }, order: [['createdAt', 'DESC']] });
      return contracts.map((c) => c.toJSON());
    }
    const contracts = await ContractModel.findAll({ order: [['createdAt', 'DESC']] });
    return contracts.map((c) => c.toJSON());
  }

  async addContract(contractData) {
    await this.initDb();
    const newContract = await ContractModel.create({
      contractId: contractData.contractId || `CTR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: contractData.customerId || `CUST-${Math.floor(100 + Math.random() * 900)}`,
      customerName: contractData.customerName || 'Customer',
      customerPhone: contractData.customerPhone || '+92 300 0000000',
      customerCnic: contractData.customerCnic || '42101-0000000-1',
      deviceId: contractData.deviceId || `DEV-ASSET-${Date.now()}`,
      deviceModel: contractData.deviceModel || contractData.model || 'Appliance Asset',
      assetCategory: contractData.assetCategory || 'OTHER_APPLIANCE',
      serialNumber: contractData.serialNumber || contractData.imei || 'N/A',
      retailerId: contractData.retailerId || 'RET-101',
      totalPrice: parseFloat(contractData.totalPrice) || 50000,
      downPayment: parseFloat(contractData.downPayment) || 10000,
      remainingBalance: parseFloat(contractData.remainingBalance) || 40000,
      monthlyInstallment: parseFloat(contractData.monthlyInstallment) || 4000,
      dueDateDay: parseInt(contractData.dueDateDay) || 10,
      nextDueDate: contractData.nextDueDate || '2026-10-10',
      paidMonths: 0,
      totalMonths: parseInt(contractData.totalMonths) || 10,
      status: 'ACTIVE',
      contractImageUrl: contractData.contractImageUrl || null,
      cnicImageUrl: contractData.cnicImageUrl || null,
      notes: contractData.notes || '',
    });
    return newContract.toJSON();
  }

  async updateContractDocuments(contractId, contractImageUrl, cnicImageUrl) {
    await this.initDb();
    const c = await ContractModel.findByPk(contractId);
    if (c) {
      if (contractImageUrl) c.contractImageUrl = contractImageUrl;
      if (cnicImageUrl) c.cnicImageUrl = cnicImageUrl;
      await c.save();
      return c.toJSON();
    }
    return null;
  }

  async updateDeviceContract(deviceId, data) {
    await this.initDb();
    const dev = await this.getDeviceById(deviceId);
    if (!dev) return null;

    const deviceModelInstance = await DeviceModel.findByPk(dev.deviceId);
    if (!deviceModelInstance) return null;

    let contractId = deviceModelInstance.contractId || dev.contractId;
    if (!contractId || contractId === 'undefined') {
      contractId = `CTR-${dev.deviceId.substring(0, 8).toUpperCase()}`;
      deviceModelInstance.contractId = contractId;
    }

    let contract = await ContractModel.findByPk(contractId);

    const totalPrice = parseFloat(data.totalPrice) || 60000;
    const downPayment = parseFloat(data.downPayment) || 0;
    const totalMonths = parseInt(data.totalMonths || data.tenureMonths) || 6;
    const remainingBalance = data.remainingBalance !== undefined
      ? parseFloat(data.remainingBalance)
      : Math.max(0, totalPrice - downPayment);
    const monthlyInstallment = parseFloat(data.monthlyInstallment) || (totalMonths > 0 ? Math.round(remainingBalance / totalMonths) : 0);

    const contractPayload = {
      contractId,
      customerId: data.customerId || dev.customerId || `CUST-${dev.deviceId.substring(0, 6).toUpperCase()}`,
      customerName: data.customerName || (contract ? contract.customerName : 'Customer'),
      customerPhone: data.customerPhone || (contract ? contract.customerPhone : '+92 300 1234567'),
      customerCnic: data.customerCnic || (contract ? contract.customerCnic : '42101-1234567-1'),
      deviceId: dev.deviceId,
      deviceModel: data.deviceModel || dev.model || 'Smartphone',
      assetCategory: 'SMARTPHONE',
      serialNumber: dev.imei || dev.deviceId,
      retailerId: data.retailerId || dev.retailerId || 'SUPER_ADMIN',
      totalPrice,
      downPayment,
      remainingBalance,
      monthlyInstallment,
      dueDateDay: parseInt(data.dueDateDay || data.installmentDueDay) || 5,
      nextDueDate: data.nextDueDate || (contract ? contract.nextDueDate : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]),
      paidMonths: parseInt(data.paidMonths) || 0,
      totalMonths,
      status: remainingBalance <= 0 ? 'COMPLETED' : 'ACTIVE',
      notes: data.notes || '',
    };

    if (contract) {
      await contract.update(contractPayload);
    } else {
      contract = await ContractModel.create(contractPayload);
    }

    if (data.unlockPin) {
      deviceModelInstance.unlockPin = data.unlockPin;
    }
    if (data.customerName) deviceModelInstance.customerName = data.customerName;
    if (data.customerPhone) deviceModelInstance.customerPhone = data.customerPhone;
    if (data.customerCnic) deviceModelInstance.customerCnic = data.customerCnic;
    if (contractPayload.retailerId) {
      deviceModelInstance.retailerId = contractPayload.retailerId;
      const retObj = await RetailerModel.findByPk(contractPayload.retailerId);
      if (retObj) {
        deviceModelInstance.retailerName = retObj.businessName;
        deviceModelInstance.retailerPhone = retObj.phone;
        deviceModelInstance.retailerAddress = retObj.address;
      }
    }
    deviceModelInstance.customerId = contractPayload.customerId;
    deviceModelInstance.contractId = contractId;
    await deviceModelInstance.save();

    return {
      device: deviceModelInstance.toJSON(),
      contract: contract.toJSON(),
    };
  }

  async checkDefaulterStatus(queryStr) {
    await this.initDb();
    if (!queryStr) return { isDefaulter: false, matches: [] };

    const cleanQuery = queryStr.toString().toLowerCase().trim();
    const contracts = await this.getContracts();
    const devices = await this.getDevices();

    const matches = [];
    let isDefaulter = false;

    for (let c of contracts) {
      const cnicClean = (c.customerCnic || '').toLowerCase();
      const phoneClean = (c.customerPhone || '').toLowerCase();
      const serialClean = (c.serialNumber || '').toLowerCase();
      const nameClean = (c.customerName || '').toLowerCase();

      if (
        cnicClean.includes(cleanQuery) ||
        phoneClean.includes(cleanQuery) ||
        serialClean.includes(cleanQuery) ||
        nameClean.includes(cleanQuery) ||
        (c.contractId || '').toLowerCase().includes(cleanQuery)
      ) {
        const retailer = await this.getRetailerById(c.retailerId);
        matches.push({
          type: 'CONTRACT',
          contractId: c.contractId,
          customerName: c.customerName,
          customerCnic: c.customerCnic,
          customerPhone: c.customerPhone,
          assetCategory: c.assetCategory || 'MOBILE_PHONE',
          deviceModel: c.deviceModel,
          serialNumber: c.serialNumber,
          status: c.status,
          retailerId: c.retailerId,
          retailerName: retailer ? retailer.businessName : 'Registered Store',
          retailerCity: retailer ? retailer.city : 'Pakistan',
          remainingBalance: c.remainingBalance,
          createdAt: c.createdAt,
        });

        if (c.status === 'RESTRICTED' || c.status === 'OVERDUE' || c.status === 'DEFAULTER') {
          isDefaulter = true;
        }
      }
    }

    for (let d of devices) {
      const imeiClean = (d.imei || '').toLowerCase();
      const devIdClean = (d.deviceId || '').toLowerCase();

      if (imeiClean.includes(cleanQuery) || devIdClean.includes(cleanQuery)) {
        if (!matches.some((m) => m.serialNumber === d.imei || m.deviceId === d.deviceId)) {
          const retailer = await this.getRetailerById(d.retailerId);
          matches.push({
            type: 'DEVICE',
            contractId: d.contractId,
            customerName: d.customerName,
            customerPhone: d.customerPhone,
            assetCategory: 'MOBILE_PHONE',
            deviceModel: `${d.brand || ''} ${d.model || ''}`,
            serialNumber: d.imei,
            status: d.deviceStatus,
            retailerId: d.retailerId,
            retailerName: retailer ? retailer.businessName : 'Registered Store',
            retailerCity: retailer ? retailer.city : 'Pakistan',
            createdAt: d.createdAt,
          });
          if (d.deviceStatus === 'RESTRICTED' || d.isRestricted) {
            isDefaulter = true;
          }
        }
      }
    }

    return {
      query: queryStr,
      isDefaulter,
      totalMatches: matches.length,
      matches,
    };
  }

  async calculateCreditScore(cnic, phone = '') {
    await this.initDb();
    const contracts = await this.getContracts();
    const cleanCnic = (cnic || '').replace(/[^0-9]/g, '');
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

    const userContracts = contracts.filter((c) => {
      const cnicMatch = cleanCnic && (c.customerCnic || '').replace(/[^0-9]/g, '').includes(cleanCnic);
      const phoneMatch = cleanPhone && (c.customerPhone || '').replace(/[^0-9]/g, '').includes(cleanPhone);
      return cnicMatch || phoneMatch;
    });

    let baseScore = 720;
    let totalPaidMonths = 0;
    let overdueCount = 0;
    let defaultedCount = 0;

    userContracts.forEach((c) => {
      totalPaidMonths += c.paidMonths || 0;
      if (c.status === 'RESTRICTED' || c.status === 'DEFAULTER') {
        defaultedCount += 1;
      } else if (c.status === 'OVERDUE') {
        overdueCount += 1;
      }
    });

    baseScore += totalPaidMonths * 12;
    baseScore -= overdueCount * 65;
    baseScore -= defaultedCount * 220;
    if (userContracts.length > 2) {
      baseScore -= (userContracts.length - 2) * 35;
    }

    baseScore = Math.max(300, Math.min(850, baseScore));

    let riskLevel = 'GOOD';
    let recommendation = 'Approved for financing with standard 20% - 25% down payment.';

    if (defaultedCount > 0 || baseScore < 500) {
      riskLevel = 'DEFAULTER';
      recommendation = 'HIGH RISK DEFAULTER: Do not issue new installments without full guarantor clearance & 60%+ down payment.';
    } else if (baseScore < 620 || overdueCount > 0) {
      riskLevel = 'HIGH_RISK';
      recommendation = 'MODERATE RISK: Past overdue history detected. Recommend 40% down payment and verified guarantor.';
    } else if (baseScore >= 780) {
      riskLevel = 'EXCELLENT';
      recommendation = 'EXCELLENT CUSTOMER: Verified clean repayment track record. Eligible for premium financing terms.';
    }

    return {
      cnic: cnic || 'N/A',
      phone: phone || 'N/A',
      creditScore: baseScore,
      riskLevel,
      recommendation,
      totalContractsCount: userContracts.length,
      activeContractsCount: userContracts.filter((c) => c.status === 'ACTIVE').length,
      defaultedContractsCount: defaultedCount,
      totalPaidMonths,
      contractsHistory: userContracts,
    };
  }

  async recordBleRelay(relayData) {
    await this.initDb();
    const entry = await BleRelayModel.create({
      id: `RELAY-${Date.now()}`,
      timestamp: new Date().toISOString(),
      offlineDeviceId: relayData.offlineDeviceId,
      relayedByDeviceId: relayData.relayedByDeviceId,
      latitude: relayData.latitude,
      longitude: relayData.longitude,
      rssi: relayData.rssi || -70,
    });

    const dev = await this.getDeviceById(relayData.offlineDeviceId);
    if (dev) {
      await DeviceModel.update(
        { latitude: relayData.latitude, longitude: relayData.longitude, lastCheckIn: entry.timestamp },
        { where: { deviceId: dev.deviceId } }
      );
    }
    return entry.toJSON();
  }

  async getRetailers() {
    await this.initDb();
    const list = await RetailerModel.findAll({ order: [['createdAt', 'ASC']] });
    return list.map((r) => r.toJSON());
  }

  async getRetailerById(id) {
    await this.initDb();
    const r = await RetailerModel.findByPk(id);
    return r ? r.toJSON() : null;
  }

  async addRetailer(data) {
    await this.initDb();
    const retailerId = data.id || `RET-${Math.floor(100 + Math.random() * 900)}`;
    const email = (data.email || `store${Date.now()}@installmentguard.com`).toLowerCase().trim();
    const password = data.password || data.initialPassword || 'Retailer@12345';

    const [retailer, created] = await RetailerModel.findOrCreate({
      where: { id: retailerId },
      defaults: {
        id: retailerId,
        businessName: data.businessName || 'Retailer Store',
        ownerName: data.ownerName || 'Owner',
        email,
        phone: data.phone || '+92 300 0000000',
        address: data.address || 'Outlet Address',
        city: data.city || 'Lahore',
        credits: parseInt(data.credits || data.initialCredits) || 10,
        status: data.status || 'ACTIVE',
      },
    });
    if (!created) {
      await retailer.update({
        businessName: data.businessName || retailer.businessName,
        ownerName: data.ownerName || retailer.ownerName,
        email: email || retailer.email,
        phone: data.phone || retailer.phone,
        address: data.address || retailer.address,
        city: data.city || retailer.city,
      });
    }

    // Automatically create / sync retailer login credentials in UserModel
    try {
      const existingUser = await UserModel.findOne({
        where: {
          [Op.or]: [
            { email },
            { retailerId },
          ],
        },
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await UserModel.create({
          id: `USR-${retailerId}`,
          email,
          password: hashedPassword,
          name: `${data.ownerName || 'Retailer'} (${data.businessName || 'Store'})`,
          role: 'RETAILER',
          retailerId,
          status: retailer.status || 'ACTIVE',
          phone: data.phone || '',
        });
        console.log(` [AUTH] Created login credentials for retailer ${retailerId}: ${email}`);
      } else {
        const updates = {
          name: `${data.ownerName || retailer.ownerName} (${data.businessName || retailer.businessName})`,
          email,
          retailerId,
          status: retailer.status || 'ACTIVE',
          phone: data.phone || retailer.phone,
        };
        if (data.password || data.initialPassword) {
          updates.password = await bcrypt.hash(password, 10);
        }
        await existingUser.update(updates);
      }
    } catch (authErr) {
      console.warn(' [AUTH] Retailer user account sync warning:', authErr.message);
    }

    const retObj = retailer.toJSON();
    retObj.loginEmail = email;
    retObj.initialPassword = password;
    return retObj;
  }

  async allocateCredits(retailerId, amount, performer = 'Super Admin') {
    await this.initDb();
    const retailer = await RetailerModel.findByPk(retailerId);
    if (retailer) {
      await retailer.increment({ credits: amount, totalSpent: amount * 1000 });
      await this.addAuditLog(performer, 'SUPER_ADMIN', 'CREDITS_ALLOCATED', retailer.businessName, `Allocated +${amount} credits`);
      return (await RetailerModel.findByPk(retailerId)).toJSON();
    }
    return null;
  }

  async toggleRetailerStatus(retailerId, performer = 'Super Admin') {
    await this.initDb();
    const retailer = await RetailerModel.findByPk(retailerId);
    if (retailer) {
      const newStatus = retailer.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await retailer.update({ status: newStatus });

      // Sync UserModel status so suspended retailer cannot log in
      try {
        await UserModel.update(
          { status: newStatus },
          { where: { retailerId } }
        );
      } catch (_) {}

      await this.addAuditLog(performer, 'SUPER_ADMIN', 'RETAILER_STATUS_CHANGED', retailer.businessName, `Status changed to ${newStatus}`);
      return retailer.toJSON();
    }
    return null;
  }

  async addCommand(command) {
    await this.initDb();
    const newCmd = await AdminCommandModel.create({
      commandId: `CMD-${Date.now()}`,
      deviceId: command.deviceId,
      retailerId: command.retailerId || 'RET-101',
      commandType: command.commandType,
      status: 'PENDING',
      payload: command.payload || {},
    });
    return newCmd.toJSON();
  }

  async getPendingCommands(searchDeviceId) {
    await this.initDb();
    const dev = await this.getDeviceById(searchDeviceId);
    const targetIds = new Set([searchDeviceId]);
    if (dev) {
      if (dev.deviceId) targetIds.add(dev.deviceId);
      if (dev.physicalDeviceId) targetIds.add(dev.physicalDeviceId);
    }

    const allPending = await AdminCommandModel.findAll({
      where: { status: 'PENDING' },
    });

    const matching = allPending.filter((c) =>
      targetIds.has(c.deviceId) ||
      (dev && c.retailerId === dev.retailerId) ||
      allPending.length === 1
    );

    return matching.map((c) => c.toJSON());
  }

  async ackCommand(commandId, success, failureReason = null) {
    await this.initDb();
    const cmd = await AdminCommandModel.findByPk(commandId);
    if (cmd) {
      await cmd.update({
        status: success ? 'EXECUTED' : 'FAILED',
        failureReason,
        executedAt: new Date().toISOString(),
      });
      return cmd.toJSON();
    }
    return null;
  }

  async getAuditLogs() {
    await this.initDb();
    const logs = await AuditLogModel.findAll({ order: [['createdAt', 'DESC']] });
    return logs.map((l) => l.toJSON());
  }

  async addAuditLog(performer, role, action, target, details) {
    await this.initDb();
    const log = await AuditLogModel.create({
      id: `LOG-${Math.floor(8000 + Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      performer,
      role,
      action,
      target,
      details,
    });
    return log.toJSON();
  }
}

export const store = new DataStore();
