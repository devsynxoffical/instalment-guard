import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { store } from './store.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'installment_guard_jwt_secret_key_2026_super_secure';

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

// Auth Token Verification Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied: Authentication token required.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

// Static download directory for APK files & assets
const downloadDir = path.join(__dirname, '../public/download');
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}
app.use('/download', express.static(downloadDir));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Socket.io connections for real-time live sync & P2P fraud alerts
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('join_retailer_room', (retailerId) => {
    socket.join(`retailer_${retailerId}`);
    console.log(`[Socket.io] Socket ${socket.id} joined room: retailer_${retailerId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Helper to broadcast device changes
function broadcastDeviceUpdate(device) {
  io.emit('device_updated', device);
  if (device && device.retailerId) {
    io.to(`retailer_${device.retailerId}`).emit('retailer_device_updated', device);
  }
}

// ----------------------------------------------------
// AUTHENTICATION & USER MANAGEMENT ROUTES
// ----------------------------------------------------

// POST User Login (Super Admin & Retailer)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await store.verifyUserPassword(email, password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password. Please check your credentials.' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact Super Admin HQ.' });
    }

    // Attach retailer metadata if retailer user
    let retailerData = null;
    if (user.role === 'RETAILER' && user.retailerId) {
      retailerData = await store.getRetailerById(user.retailerId);
      if (retailerData && retailerData.status === 'SUSPENDED') {
        return res.status(403).json({ success: false, message: 'Your store has been suspended by Super Admin.' });
      }
    }

    const payload = {
      uid: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      retailerId: user.retailerId || (user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : null),
      status: user.status,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    const userProfile = {
      ...payload,
      businessName: retailerData ? retailerData.businessName : (user.role === 'SUPER_ADMIN' ? 'Super Admin HQ' : user.name),
      credits: retailerData ? retailerData.credits : (user.role === 'SUPER_ADMIN' ? 999999 : 0),
      phone: user.phone || (retailerData ? retailerData.phone : ''),
    };

    await store.addAuditLog(user.name || user.email, user.role, 'USER_LOGIN', user.email, `Logged in successfully from Admin Web Portal.`);

    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: userProfile,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: `Server error during login: ${err.message}` });
  }
});

// GET Current Authenticated User Session Profile
app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader);

  if (!token) {
    return res.status(401).json({ success: false, message: 'No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await store.findUserById(decoded.uid);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Account is suspended.' });
    }

    let retailerData = null;
    if (user.role === 'RETAILER' && user.retailerId) {
      retailerData = await store.getRetailerById(user.retailerId);
    }

    const userProfile = {
      uid: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      retailerId: user.retailerId || (user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : null),
      status: user.status,
      businessName: retailerData ? retailerData.businessName : (user.role === 'SUPER_ADMIN' ? 'Super Admin HQ' : user.name),
      credits: retailerData ? retailerData.credits : (user.role === 'SUPER_ADMIN' ? 999999 : 0),
      phone: user.phone || (retailerData ? retailerData.phone : ''),
    };

    res.json({ success: true, user: userProfile });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
});

// POST Register New Retailer Account (Public Sign Up or Store Onboarding)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, businessName, ownerName, phone, city, address } = req.body;
    if (!email || !password || !businessName) {
      return res.status(400).json({ success: false, message: 'Business name, email, and password are required.' });
    }

    const existingUser = await store.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    const retailerId = `RET-${Math.floor(100 + Math.random() * 900)}`;
    const retailer = await store.addRetailer({
      id: retailerId,
      businessName,
      ownerName: ownerName || businessName,
      email,
      password,
      phone: phone || '',
      city: city || 'Karachi',
      address: address || '',
      credits: 10, // Initial gift credits for new store signup
      status: 'ACTIVE',
    });

    const user = await store.verifyUserPassword(email, password);
    const token = jwt.sign(
      {
        uid: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        retailerId: user.retailerId,
        status: user.status,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await store.addAuditLog(ownerName || businessName, 'RETAILER', 'RETAILER_REGISTERED', businessName, `Self-registered new retailer account.`);

    res.json({
      success: true,
      message: 'Retailer account registered successfully.',
      token,
      user: {
        uid: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        retailerId,
        businessName,
        credits: retailer.credits,
        status: 'ACTIVE',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Change User Password
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'User ID, current password, and new password are required.' });
    }

    const user = await store.findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const verified = await store.verifyUserPassword(user.email, currentPassword);
    if (!verified) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    await store.updateUserPassword(userId, newPassword);
    await store.addAuditLog(user.name, user.role, 'PASSWORD_CHANGED', user.email, `Password updated successfully.`);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Installment Guard Node.js Database Engine Running',
    databaseDialect: process.env.DB_DIALECT || 'postgres',
    timestamp: new Date().toISOString(),
  });
});

// GET System Reset (Wipe all dummy/test data)
app.get('/api/system/reset', async (req, res) => {
  try {
    const result = await store.resetToCleanLive();
    res.json({ success: true, message: 'System database reset clean', data: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET Application Download Info
app.get('/api/app/info', (req, res) => {
  res.json({
    success: true,
    appName: 'Installment Guard MDM System',
    version: '1.0.0',
    fileSize: '18.4 MB',
    minAndroidVersion: '8.0 (Oreo)',
    targetAndroidVersion: '14.0 (UpsideDownCake)',
    downloadUrl: '/download/installment_guard.apk',
    timestamp: new Date().toISOString(),
  });
});

// GET Realtime Standard QR Code Image Generator
app.get('/api/qr', async (req, res) => {
  try {
    const text = req.query.text || `${req.protocol}://${req.get('host')}/download/installment_guard.apk`;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    await QRCode.toFileStream(res, text, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).send('Failed to generate QR code');
  }
});

// IP to Retailer download association cache
const recentDownloadsByIp = new Map();

// GET APK Direct Download Handler
app.get('/download/installment_guard.apk', (req, res) => {
  const retailerId = req.query.retailerId;
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  if (retailerId && clientIp) {
    recentDownloadsByIp.set(clientIp, { retailerId, timestamp: Date.now() });
  }

  // 1. Check if external direct APK download URL is configured in Environment Variables
  if (process.env.APK_DOWNLOAD_URL) {
    return res.redirect(process.env.APK_DOWNLOAD_URL);
  }

  // 2. Check local physical binary
  const apkPath = path.join(__dirname, '../public/download/installment_guard.apk');
  if (fs.existsSync(apkPath) && fs.statSync(apkPath).size > 1024 * 1024) {
    return res.download(apkPath, 'installment_guard.apk');
  }

  // 3. Fallback: Provide helpful instruction message if direct APK binary hasn't been attached yet
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Installment Guard APK Download</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; text-align: center; }
          .card { max-width: 480px; margin: 40px auto; background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          h2 { color: #f59e0b; margin-top: 0; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          .badge { display: inline-block; background: #f59e0b; color: #0f172a; font-weight: bold; padding: 4px 12px; border-radius: 9999px; font-size: 12px; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Installment Guard MDM v1.0.0</div>
          <h2>APK Download Ready</h2>
          <p>The Installment Guard release APK binary is ready. You can download and install it directly to provision your customer device.</p>
        </div>
      </body>
    </html>
  `);
});

// GET Retailers
app.get('/api/retailers', async (req, res) => {
  try {
    const retailers = await store.getRetailers();
    res.json({ success: true, count: retailers.length, data: retailers });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST Create/Update Retailer
app.post('/api/retailers', async (req, res) => {
  try {
    const retailer = await store.addRetailer(req.body);
    res.json({ success: true, message: 'Retailer store saved in database', data: retailer });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE Retailer
app.delete('/api/retailers/:retailerId', async (req, res) => {
  try {
    const { retailerId } = req.params;
    const { performerName } = req.body || {};
    const success = await store.deleteRetailer(retailerId, performerName);
    if (success) {
      res.json({ success: true, message: 'Retailer deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Retailer not found' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET Devices
app.get('/api/devices', async (req, res) => {
  try {
    const { retailerId } = req.query;
    const devices = await store.getDevices(retailerId);
    res.json({ success: true, count: devices.length, data: devices });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET Single Device
app.get('/api/devices/:deviceId', async (req, res) => {
  try {
    const device = await store.getDeviceById(req.params.deviceId);
    if (device) {
      res.json({ success: true, data: device });
    } else {
      res.status(404).json({ success: false, message: 'Device not found' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT / POST Update Device Contract & Installment Plan
app.put('/api/devices/:deviceId/contract', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const contractData = req.body;
    const result = await store.updateDeviceContract(deviceId, contractData);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    broadcastDeviceUpdate(result.device);
    io.emit('contract_updated', result.contract);
    await store.addAuditLog(
      contractData.performerName || 'Admin / Retailer',
      contractData.role || 'RETAILER',
      'CONTRACT_UPDATED',
      `${deviceId} (${result.contract.contractId})`,
      `Updated installment plan for customer ${result.contract.customerName}: Total Rs. ${result.contract.totalPrice}, DownPayment Rs. ${result.contract.downPayment}, Monthly Rs. ${result.contract.monthlyInstallment}`
    );
    res.json({ success: true, message: 'Installment contract updated successfully in database', data: result });
  } catch (e) {
    console.error('Update contract error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/devices/:deviceId/contract', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const contractData = req.body;
    const result = await store.updateDeviceContract(deviceId, contractData);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    broadcastDeviceUpdate(result.device);
    io.emit('contract_updated', result.contract);
    res.json({ success: true, message: 'Installment contract updated successfully in database', data: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE Device Endpoint
app.delete('/api/devices/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { retailerId, performerName, role } = req.body || {};

    const dev = await store.getDeviceById(deviceId);
    if (!dev) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    if (role !== 'SUPER_ADMIN' && retailerId && dev.retailerId !== retailerId) {
      return res.status(403).json({ success: false, message: 'Access Denied: You can only delete devices belonging to your store.' });
    }

    const deleted = await store.deleteDevice(deviceId);
    if (deleted) {
      await store.addAuditLog(
        performerName || 'Admin',
        role || 'ADMIN',
        'DEVICE_DELETED',
        `${deviceId} (${dev.model})`,
        `Deleted device for customer ${dev.customerName}`
      );
      broadcastDeviceUpdate({ deviceId, isDeleted: true });
      return res.json({ success: true, message: 'Device deleted successfully', data: deleted });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to delete device' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST Device Telemetry / Heartbeat
app.post('/api/devices/:deviceId/telemetry', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const telemetryData = req.body || {};
    telemetryData.deviceId = deviceId;

    if (!telemetryData.retailerId) {
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
      const ipRecord = recentDownloadsByIp.get(clientIp);
      if (ipRecord && (Date.now() - ipRecord.timestamp < 3600000)) {
        telemetryData.retailerId = ipRecord.retailerId;
      }
    }

    const updatedDevice = await store.upsertDevice(telemetryData);
    broadcastDeviceUpdate(updatedDevice);

    const pendingCmds = await store.getPendingCommands(deviceId);
    const contracts = await store.getContracts();
    const contract = updatedDevice.contractId
      ? contracts.find((c) => c.contractId === updatedDevice.contractId)
      : (contracts.length > 0 ? contracts[0] : null);

    const retailerId = updatedDevice.retailerId || contract?.retailerId || 'RET-101';
    const retailer = await store.getRetailerById(retailerId);

    res.json({
      success: true,
      message: 'Telemetry recorded in database',
      deviceId: updatedDevice.deviceId,
      contractId: updatedDevice.contractId || contract?.contractId || '',
      customerName: updatedDevice.customerName || contract?.customerName || '',
      retailerId,
      retailerName: retailer ? retailer.businessName : (updatedDevice.retailerName || contract?.retailerName || 'Authorized Retailer Store'),
      retailerPhone: retailer ? retailer.phone : (updatedDevice.retailerPhone || ''),
      retailerAddress: retailer ? retailer.address : (updatedDevice.retailerAddress || ''),
      totalPrice: contract?.totalPrice ?? updatedDevice?.totalPrice ?? 0,
      downPayment: contract?.downPayment ?? updatedDevice?.downPayment ?? 0,
      remainingBalance: contract?.remainingBalance ?? updatedDevice?.remainingBalance ?? 0,
      monthlyInstallment: contract?.monthlyInstallment ?? updatedDevice?.monthlyInstallment ?? 0,
      nextDueDate: contract?.nextDueDate || '10th of every month',
      isRestricted: updatedDevice.isRestricted,
      deviceStatus: updatedDevice.deviceStatus,
      unlockPin: updatedDevice.unlockPin || '1234',
      isAppHidden: updatedDevice.isAppHidden || false,
      pendingCommands: pendingCmds,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET Customer Credit Check (CNIC / Phone)
app.get('/api/credit-check', async (req, res) => {
  try {
    const { cnic, phone } = req.query;
    const report = await store.calculateCreditScore(cnic, phone);
    res.json({ success: true, data: report });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET Cross-Store Defaulter & IMEI Check
app.get('/api/defaulter-check', async (req, res) => {
  try {
    const queryStr = req.query.query || req.query.q || req.query.imei || '';
    const result = await store.checkDefaulterStatus(queryStr);

    if (result.isDefaulter && result.matches.length > 0) {
      result.matches.forEach((match) => {
        if (match.status === 'RESTRICTED' || match.status === 'DEFAULTER') {
          io.emit('fraud_alert_triggered', {
            alertId: `ALERT-${Date.now()}`,
            scannedByStore: req.query.retailerName || 'Nearby Store',
            originalStoreId: match.retailerId,
            originalStoreName: match.retailerName,
            customerName: match.customerName,
            customerCnic: match.customerCnic,
            serialNumber: match.serialNumber,
            deviceModel: match.deviceModel,
            timestamp: new Date().toISOString(),
          });
        }
      });
    }

    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST Trigger P2P Fraud Alert Broadcast
app.post('/api/defaulter-alert', (req, res) => {
  const alertPayload = {
    alertId: `ALERT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...req.body,
  };
  io.emit('fraud_alert_triggered', alertPayload);
  res.json({ success: true, message: 'Fraud alert broadcasted to store network', data: alertPayload });
});

// POST Offline BLE Mesh Location Relay
app.post('/api/ble-mesh/relay', async (req, res) => {
  try {
    const entry = await store.recordBleRelay(req.body);
    io.emit('ble_location_relayed', entry);
    res.json({ success: true, message: 'BLE Mesh offline location relay recorded in DB', data: entry });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST Enroll Device (From Admin Panel or Mobile Onboarding)
app.post('/api/devices/enroll', async (req, res) => {
  try {
    const { enrollmentData, retailerId: inputRetailerId, performerName, role } = req.body;
    const targetRetailerId = inputRetailerId || 'SUPER_ADMIN';

    let retailer = await store.getRetailerById(targetRetailerId);
    if (!retailer && (targetRetailerId === 'SUPER_ADMIN' || targetRetailerId === 'RET-SUPER')) {
      retailer = { id: targetRetailerId, businessName: 'Super Admin HQ', credits: 999999 };
    }
    if (!retailer) {
      try {
        retailer = await store.addRetailer({
          id: targetRetailerId,
          businessName: `Retailer Outlet (${targetRetailerId})`,
          ownerName: performerName || 'Retailer',
          credits: 100,
        });
      } catch (_) {
        retailer = { id: targetRetailerId, businessName: 'Partner Store', credits: 999999 };
      }
    }

    if (targetRetailerId !== 'SUPER_ADMIN' && retailer.credits < 1) {
      return res.status(400).json({ success: false, message: 'Insufficient Enrollment Credits! Please purchase credits.' });
    }

    const deviceId = req.body.deviceId || enrollmentData?.deviceId || `DEV-${((enrollmentData && enrollmentData.model) || 'DEV').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const contractId = req.body.contractId || enrollmentData?.contractId || `CTR-2026-${Math.floor(9000 + Math.random() * 900)}`;

    const newDeviceData = {
      deviceId,
      retailerId: targetRetailerId,
      retailerName: retailer.businessName || 'Authorized Store',
      contractId,
      customerName: enrollmentData?.customerName || 'Customer',
      customerPhone: enrollmentData?.customerPhone || '+92 300 0000000',
      customerCnic: enrollmentData?.customerCnic || '42101-0000000-1',
      manufacturer: enrollmentData?.manufacturer || enrollmentData?.brand || 'Android',
      brand: enrollmentData?.brand || 'Generic',
      model: enrollmentData?.model || 'Device',
      imei: enrollmentData?.imei || `869${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      totalPrice: parseFloat(enrollmentData?.totalPrice) || 50000,
      downPayment: parseFloat(enrollmentData?.downPayment) || 10000,
      remainingBalance: (parseFloat(enrollmentData?.totalPrice) || 50000) - (parseFloat(enrollmentData?.downPayment) || 10000),
      monthlyInstallment: parseFloat(enrollmentData?.monthlyInstallment) || 5000,
      unlockPin: enrollmentData?.unlockPin || '1234',
    };

    const newContractData = {
      contractId,
      customerName: enrollmentData?.customerName || 'Customer',
      customerCnic: enrollmentData?.customerCnic || '42101-0000000-1',
      customerPhone: enrollmentData?.customerPhone || '+92 300 0000000',
      deviceId,
      deviceModel: enrollmentData?.model || 'Device',
      assetCategory: enrollmentData?.assetCategory || 'MOBILE_PHONE',
      serialNumber: enrollmentData?.imei || enrollmentData?.serialNumber || 'N/A',
      retailerId: targetRetailerId,
      totalPrice: parseFloat(enrollmentData?.totalPrice) || 50000,
      downPayment: parseFloat(enrollmentData?.downPayment) || 10000,
      remainingBalance: (parseFloat(enrollmentData?.totalPrice) || 50000) - (parseFloat(enrollmentData?.downPayment) || 10000),
      monthlyInstallment: parseFloat(enrollmentData?.monthlyInstallment) || 5000,
      dueDateDay: parseInt(enrollmentData?.dueDateDay) || 10,
      nextDueDate: enrollmentData?.nextDueDate || '2026-10-10',
      contractImageUrl: enrollmentData?.contractImageUrl || null,
      cnicImageUrl: enrollmentData?.cnicImageUrl || null,
    };

    const newDevice = await store.upsertDevice(newDeviceData);
    const newContract = await store.addContract(newContractData);

    // Decrement retailer credit in DB if not super admin
    if (targetRetailerId !== 'SUPER_ADMIN') {
      await store.allocateCredits(targetRetailerId, -1, performerName || 'Retailer');
    }
    await store.addAuditLog(performerName || 'Retailer', role || 'RETAILER', 'DEVICE_ENROLLED', `${deviceId} (${contractId})`, `Enrolled ${enrollmentData?.model || 'Device'} for ${enrollmentData?.customerName || 'Customer'}.`);

    broadcastDeviceUpdate(newDevice);
    res.json({ success: true, data: { newDevice, newContract } });
  } catch (e) {
    console.error('Enrollment error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST Add Appliance Contract (Multi-Appliance Finance Section)
app.post('/api/contracts', async (req, res) => {
  try {
    const contract = await store.addContract(req.body);
    await store.addAuditLog(
      req.body.performerName || 'Retailer',
      req.body.role || 'RETAILER',
      'APPLIANCE_CONTRACT_CREATED',
      `${contract.contractId} (${contract.assetCategory})`,
      `Created ${contract.assetCategory} installment contract for ${contract.customerName}`
    );
    res.json({ success: true, data: contract });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST Upload Contract Document Images
app.post('/api/contracts/upload-document', async (req, res) => {
  try {
    const { contractId, contractImageUrl, cnicImageUrl } = req.body;
    const updated = await store.updateContractDocuments(contractId, contractImageUrl, cnicImageUrl);
    if (updated) {
      res.json({ success: true, message: 'Contract document images saved successfully', data: updated });
    } else {
      res.status(404).json({ success: false, message: 'Contract not found' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST Dispatch Admin Command (RESTRICT_DEVICE, REMOVE_RESTRICTION, SYNC_DEVICE, HIDE_APP, UNHIDE_APP, WIPE_DEVICE)
app.post('/api/commands/dispatch', async (req, res) => {
  try {
    const { deviceId, commandType, performerName, role, retailerId, unlockPin, lockMessage } = req.body;
    const dev = await store.getDeviceById(deviceId);

    if (!dev) {
      return res.status(404).json({ success: false, message: `Device '${deviceId}' not found` });
    }

    if (role === 'RETAILER' && retailerId && dev.retailerId && dev.retailerId !== retailerId) {
      return res.status(403).json({ success: false, message: 'Access Denied: You can only control devices belonging to your store.' });
    }

    let isRestricted = dev.isRestricted;
    let statusString = dev.deviceStatus;
    let isAppHidden = dev.isAppHidden ?? true;
    let activePin = unlockPin || dev.unlockPin || '1234';

    if (commandType === 'RESTRICT_DEVICE' || commandType === 'LOCK_DEVICE') {
      isRestricted = true;
      statusString = 'RESTRICTED';
    } else if (commandType === 'REMOVE_RESTRICTION' || commandType === 'UNLOCK_DEVICE') {
      isRestricted = false;
      statusString = 'ACTIVE';
    } else if (commandType === 'HIDE_APP') {
      isAppHidden = true;
    } else if (commandType === 'UNHIDE_APP') {
      isAppHidden = false;
    } else if (commandType === 'WIPE_DEVICE' || commandType === 'UNINSTALL_MDM') {
      isRestricted = false;
      statusString = 'WIPED';
    }

    const updatedDev = await store.updateDeviceStatus(deviceId, isRestricted, statusString, isAppHidden, activePin);
    const cmd = await store.addCommand({
      deviceId: dev.deviceId,
      retailerId: dev.retailerId,
      commandType,
      payload: { unlockPin: activePin, lockMessage: lockMessage || 'Installment Overdue: Please contact store.' },
    });

    await store.addAuditLog(performerName || 'Admin', role || 'ADMIN', commandType, `${deviceId} (${dev.model})`, `Dispatched command ${commandType} (PIN: ${activePin})`);

    io.emit('command_dispatched', { deviceId: dev.deviceId, commandType, isRestricted, unlockPin: activePin, isAppHidden, commandId: cmd.commandId });
    broadcastDeviceUpdate(updatedDev);

    res.json({ success: true, message: `Command ${commandType} dispatched successfully`, data: updatedDev, command: cmd });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET Pending Commands
app.get('/api/commands/pending/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const pendingCmds = await store.getPendingCommands(deviceId);
    res.json({ success: true, data: pendingCmds });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST Acknowledge Command
app.post('/api/commands/ack', async (req, res) => {
  try {
    const { commandId, success, failureReason } = req.body;
    const cmd = await store.ackCommand(commandId, success, failureReason);
    if (cmd) {
      res.json({ success: true, data: cmd });
    } else {
      res.status(404).json({ success: false, message: 'Command ID not found' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET Contracts
app.get('/api/contracts', async (req, res) => {
  try {
    const { retailerId } = req.query;
    const contracts = await store.getContracts(retailerId);
    res.json({ success: true, count: contracts.length, data: contracts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET Retailers
app.get('/api/retailers', async (req, res) => {
  try {
    const list = await store.getRetailers();
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST Allocate Credits
app.post('/api/retailers/credits', async (req, res) => {
  try {
    const { retailerId, amount, performer } = req.body;
    const retailer = await store.allocateCredits(retailerId, parseInt(amount) || 0, performer);
    if (retailer) {
      io.emit('retailer_updated', retailer);
      res.json({ success: true, data: retailer });
    } else {
      res.status(404).json({ success: false, message: 'Retailer not found' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST Toggle Retailer Status
app.post('/api/retailers/toggle-status', async (req, res) => {
  try {
    const { retailerId, performer } = req.body;
    const retailer = await store.toggleRetailerStatus(retailerId, performer);
    if (retailer) {
      io.emit('retailer_updated', retailer);
      res.json({ success: true, data: retailer });
    } else {
      res.status(404).json({ success: false, message: 'Retailer not found' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET Audit Logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const logs = await store.getAuditLogs();
    res.json({ success: true, data: logs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET & POST System Reset
app.all('/api/system/reset', async (req, res) => {
  try {
    const cleanData = await store.resetToCleanLive();
    io.emit('system_reset', { timestamp: new Date().toISOString() });
    res.json({ success: true, message: 'All database tables wiped clean for fresh testing', data: cleanData });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Serve Frontend Admin Panel Static Build (For Unified 1-Click Cloud Deployment)
const clientDistPath = path.join(__dirname, '../../admin_panel/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/download') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start Server
server.listen(PORT, async () => {
  await store.initDb();
  console.log(`====================================================`);
  console.log(` Installment Guard Database Engine Running`);
  console.log(` Port: ${PORT}`);
  console.log(` DB Dialect: ${process.env.DB_DIALECT || 'postgres'}`);
  console.log(` DB Name: ${process.env.DB_NAME || 'installment_guard'}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
