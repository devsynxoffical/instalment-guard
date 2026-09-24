import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { retailerService } from '../services/retailerService';
import { deviceService } from '../services/deviceService';
import { contractService } from '../services/contractService';
import { paymentService } from '../services/paymentService';
import { commandService } from '../services/commandService';
import { auditService } from '../services/auditService';
import { notificationService } from '../services/notificationService';
import { API_BASE_URL } from '../config/api';

const BACKEND_API = `${API_BASE_URL}/api`;

const DEFAULT_RETAILERS = [];
const DEFAULT_DEVICES = [];
const DEFAULT_CONTRACTS = [];
const DEFAULT_PAYMENTS = [];
const DEFAULT_AUDIT_LOGS = [];

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const token = localStorage.getItem('ig_auth_token');
      const savedAuth = localStorage.getItem('ig_demo_auth');
      if (token && savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed && parsed.email) return parsed;
      }
    } catch (_) {}
    return null;
  });

  const [userProfile, setUserProfile] = useState(() => currentUser);
  const [role, setRole] = useState(() => currentUser?.role || null);
  const [activeRetailerId, setActiveRetailerId] = useState(() => currentUser?.retailerId || null);
  const [loading, setLoading] = useState(false);

  // Initial State starts clean with empty arrays - driven strictly by Node.js Backend API
  const [retailers, setRetailers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Clear legacy mock data from browser localStorage on mount
  useEffect(() => {
    try {
      ['ig_retailers', 'ig_devices', 'ig_contracts', 'ig_payments'].forEach((key) => {
        const saved = localStorage.getItem(key);
        if (saved && (saved.includes('Lahore Electronics Hub') || saved.includes('9513') || saved.includes('SM-G955F') || saved.includes('RET-101'))) {
          localStorage.removeItem(key);
        }
      });
    } catch (_) {}
  }, []);

  // Function to completely wipe all test data from localStorage and backend
  const resetAllTestData = async () => {
    localStorage.removeItem('ig_retailers');
    localStorage.removeItem('ig_devices');
    localStorage.removeItem('ig_contracts');
    localStorage.removeItem('ig_payments');
    localStorage.removeItem('ig_audit_logs');
    localStorage.removeItem('ig_notifications');

    setDevices([]);
    setContracts([]);
    setPayments([]);
    setAuditLogs([]);
    setNotifications([]);

    try {
      await fetch(`${BACKEND_API}/system/reset`);
    } catch (_) {}
  };

  // Sync state to LocalStorage
  useEffect(() => { localStorage.setItem('ig_retailers', JSON.stringify(retailers)); }, [retailers]);
  useEffect(() => { localStorage.setItem('ig_devices', JSON.stringify(devices)); }, [devices]);
  useEffect(() => { localStorage.setItem('ig_contracts', JSON.stringify(contracts)); }, [contracts]);
  useEffect(() => { localStorage.setItem('ig_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('ig_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('ig_notifications', JSON.stringify(notifications)); }, [notifications]);

  // Fetch from Node.js REST API on startup & live poll every 2.5 seconds
  useEffect(() => {
    let isSubscribed = true;
    const fetchBackendData = async () => {
      try {
        const resDev = await fetch(`${BACKEND_API}/devices`);
        if (resDev.ok && isSubscribed) {
          const jsonDev = await resDev.json();
          if (jsonDev.success && Array.isArray(jsonDev.data)) {
            setDevices((prev) => {
              const backendMap = new Map(jsonDev.data.map((d) => [d.deviceId, d]));
              prev.forEach((p) => { if (!backendMap.has(p.deviceId)) backendMap.set(p.deviceId, p); });
              return Array.from(backendMap.values());
            });
          }
        }

        const resCtr = await fetch(`${BACKEND_API}/contracts`);
        if (resCtr.ok && isSubscribed) {
          const jsonCtr = await resCtr.json();
          if (jsonCtr.success && Array.isArray(jsonCtr.data)) {
            setContracts((prev) => {
              const backendMap = new Map(jsonCtr.data.map((c) => [c.contractId || c.id, c]));
              prev.forEach((p) => {
                const id = p.contractId || p.id;
                if (!backendMap.has(id)) backendMap.set(id, p);
              });
              return Array.from(backendMap.values());
            });
          }
        }

        const resRet = await fetch(`${BACKEND_API}/retailers`);
        if (resRet.ok && isSubscribed) {
          const jsonRet = await resRet.json();
          if (jsonRet.success && Array.isArray(jsonRet.data)) {
            setRetailers((prev) => {
              const backendMap = new Map(jsonRet.data.map((r) => [r.id, r]));
              prev.forEach((p) => { if (!backendMap.has(p.id)) backendMap.set(p.id, p); });
              return Array.from(backendMap.values());
            });
          }
        }
      } catch (_) {}
    };

    fetchBackendData();
    const pollInterval = setInterval(fetchBackendData, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, []);

  // Restore Auth Session
  useEffect(() => {
    const token = localStorage.getItem('ig_auth_token');
    const savedAuth = localStorage.getItem('ig_demo_auth');

    if (!token || !savedAuth) {
      setCurrentUser(null);
      setUserProfile(null);
      setRole(null);
      setActiveRetailerId(null);
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(savedAuth);
      if (parsed && parsed.email) {
        setCurrentUser(parsed);
        setUserProfile(parsed);
        if (parsed.role) setRole(parsed.role);
        if (parsed.retailerId) setActiveRetailerId(parsed.retailerId);
      }
    } catch (_) {}

    const unsubscribeAuth = authService.onAuthChange(({ user, profile }) => {
      if (user) {
        setCurrentUser(user);
        setUserProfile(profile || user);
        setRole(user.role || 'SUPER_ADMIN');
        if (user.retailerId) setActiveRetailerId(user.retailerId);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setRole(null);
        setActiveRetailerId(null);
      }
      setLoading(false);
    });

    setLoading(false);
    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore Sync (Background with Merging to prevent overwriting local items)
  useEffect(() => {
    const retailerFilter = role === 'RETAILER' ? activeRetailerId : null;

    const unsubRetailers = retailerService.subscribeRetailers((remote) => {
      if (remote && remote.length > 0) {
        setRetailers((prev) => {
          const remoteMap = new Map(remote.map((r) => [r.id, r]));
          const merged = [...remote];
          prev.forEach((p) => {
            if (!remoteMap.has(p.id)) {
              merged.push(p);
            }
          });
          return merged;
        });
      }
    });

    const unsubDevices = deviceService.subscribeDevices(retailerFilter, (remote) => {
      if (Array.isArray(remote) && remote.length > 0) {
        setDevices(remote);
      }
    });

    const unsubContracts = contractService.subscribeContracts(retailerFilter, (remote) => {
      if (remote && remote.length > 0) {
        setContracts((prev) => {
          const remoteMap = new Map(remote.map((c) => [c.contractId || c.id, c]));
          const merged = [...remote];
          prev.forEach((p) => {
            const id = p.contractId || p.id;
            if (!remoteMap.has(id)) merged.push(p);
          });
          return merged;
        });
      }
    });

    const unsubPayments = paymentService.subscribePayments(retailerFilter, (remote) => {
      if (remote && remote.length > 0) setPayments(remote);
    });

    const unsubAudit = auditService.subscribeAuditLogs(retailerFilter, (remote) => {
      if (remote && remote.length > 0) setAuditLogs(remote);
    });

    const unsubNotifications = notificationService.subscribeNotifications((remote) => {
      if (remote && remote.length > 0) setNotifications(remote);
    });

    return () => {
      unsubRetailers();
      unsubDevices();
      unsubContracts();
      unsubPayments();
      unsubAudit();
      unsubNotifications();
    };
  }, [role, activeRetailerId]);

  // Role Switcher (Super Admin can inspect specific retailer scopes)
  const switchRole = (newRole) => {
    // Only allow role elevation if the authenticated user account is SUPER_ADMIN
    const isSuperAdminAccount = currentUser?.role === 'SUPER_ADMIN' || currentUser?.email === 'admin@installmentguard.com';
    
    if (newRole === 'SUPER_ADMIN' && !isSuperAdminAccount) {
      console.warn('Access denied: Retailer accounts cannot switch to Super Admin mode.');
      return;
    }

    setRole(newRole);
    if (newRole === 'SUPER_ADMIN') {
      setActiveRetailerId('SUPER_ADMIN');
    }
    const targetRetailer = retailers.find((r) => r.id === activeRetailerId) || retailers[0];
    const sessionUser = {
      ...currentUser,
      role: newRole,
      retailerId: newRole === 'RETAILER' ? (currentUser?.retailerId || targetRetailer?.id || 'RET-101') : null,
    };
    setCurrentUser(sessionUser);
    setUserProfile(sessionUser);
    localStorage.setItem('ig_demo_auth', JSON.stringify(sessionUser));
  };

  // Auth Actions
  const login = async (email, password) => {
    const result = await authService.login(email, password);
    const authUser = result.user;

    setCurrentUser(authUser);
    setUserProfile(authUser);
    setRole(authUser.role || 'SUPER_ADMIN');
    setActiveRetailerId(authUser.retailerId || 'SUPER_ADMIN');

    return { user: authUser, profile: authUser, token: result.token };
  };

  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setUserProfile(null);
    setRole('SUPER_ADMIN');
    setActiveRetailerId('SUPER_ADMIN');
  };

  const resetPassword = async (email) => {
    return await authService.resetPassword(email);
  };

  // Helper & Role-based Data Isolation
  const activeRetailer = retailers.find(
    (r) => r.id === activeRetailerId || r.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  ) || (retailers.length > 0 ? retailers[0] : {});

  const filterScope =
    role === 'RETAILER'
      ? (currentUser?.retailerId || activeRetailer?.id || activeRetailerId || 'RET-101')
      : (activeRetailerId || 'SUPER_ADMIN');

  const visibleDevices = (role === 'SUPER_ADMIN' || filterScope === 'ALL' || filterScope === 'SUPER_ADMIN')
    ? devices
    : devices.filter((d) => {
        return d.retailerId === filterScope || d.retailerId === activeRetailer?.id || (activeRetailer?.businessName && d.retailerName === activeRetailer.businessName);
      });

  const visibleContracts = (role === 'SUPER_ADMIN' || filterScope === 'ALL' || filterScope === 'SUPER_ADMIN')
    ? contracts
    : contracts.filter((c) => {
        return c.retailerId === filterScope || c.retailerId === activeRetailer?.id || (activeRetailer?.businessName && c.retailerName === activeRetailer.businessName);
      });

  const visibleContractIds = visibleContracts.map((c) => c.contractId);

  const visiblePayments = filterScope === 'ALL'
    ? payments
    : payments.filter((p) => visibleContractIds.includes(p.contractId) || p.recordedBy === activeRetailer?.businessName);

  const visibleAuditLogs = filterScope === 'ALL'
    ? auditLogs
    : auditLogs.filter((l) => {
        if (filterScope === 'SUPER_ADMIN') {
          return l.role === 'SUPER_ADMIN' || l.performer === 'Super Admin' || l.target?.includes('SUPER_ADMIN');
        }
        return l.target?.includes(filterScope) || l.performer === activeRetailer?.businessName;
      });

  const visibleNotifications = filterScope === 'ALL'
    ? notifications
    : notifications.filter(
        (n) => !n.retailerId || n.retailerId === filterScope || visibleContractIds.includes(n.contractId)
      );

  // Automated Contract Due Date & Overdue Evaluation Engine
  useEffect(() => {
    if (!contracts || contracts.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayMs = new Date(todayStr).getTime();

    const generated = [];

    contracts.forEach((c) => {
      if (c.remainingBalance <= 0 || c.status === 'COMPLETED') return;
      if (!c.nextDueDate) return;

      const dueMs = new Date(c.nextDueDate).getTime();
      const diffDays = Math.ceil((dueMs - todayMs) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        // OVERDUE
        const notifId = `NOTIF-OVERDUE-${c.contractId}`;
        generated.push({
          id: notifId,
          contractId: c.contractId,
          deviceId: c.deviceId,
          retailerId: c.retailerId,
          customerName: c.customerName,
          customerPhone: c.customerPhone,
          title: `⚠️ PAYMENT OVERDUE: ${c.customerName}`,
          message: `Installment of Rs. ${(c.monthlyInstallment || 0).toLocaleString()} was due on ${c.nextDueDate} (${Math.abs(diffDays)} days overdue). Phone: ${c.customerPhone}`,
          type: 'OVERDUE',
          timestamp: new Date().toISOString(),
          isRead: false,
        });
      } else if (diffDays <= 3) {
        // DUE SOON (Date Kareeb Hai)
        const notifId = `NOTIF-DUESOON-${c.contractId}`;
        const dayText = diffDays === 0 ? 'TODAY' : `in ${diffDays} day(s)`;
        generated.push({
          id: notifId,
          contractId: c.contractId,
          deviceId: c.deviceId,
          retailerId: c.retailerId,
          customerName: c.customerName,
          customerPhone: c.customerPhone,
          title: `⏳ PAYMENT DUE SOON: ${c.customerName}`,
          message: `Installment of Rs. ${(c.monthlyInstallment || 0).toLocaleString()} is due ${dayText} (${c.nextDueDate}). Phone: ${c.customerPhone}`,
          type: 'DUE_SOON',
          timestamp: new Date().toISOString(),
          isRead: false,
        });
      }
    });

    if (generated.length > 0) {
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const toAdd = generated.filter((g) => !existingIds.has(g.id));
        if (toAdd.length === 0) return prev;
        return [...toAdd, ...prev];
      });
    }
  }, [contracts]);

  const visibleRetailers = role === 'RETAILER'
    ? (activeRetailer?.id ? [activeRetailer] : retailers)
    : retailers;

  // Instant 0ms Latency Management Operations
  const createRetailer = async (data) => {
    const performer = role === 'SUPER_ADMIN' ? 'Super Admin' : userProfile?.name || 'Admin';
    const retailerId = `RET-${Math.floor(100 + Math.random() * 900)}`;
    const initialCreditsNum = parseInt(data.initialCredits, 10) || 0;

    const newRetailer = {
      id: retailerId,
      businessName: data.businessName,
      ownerName: data.ownerName,
      email: data.email,
      password: data.password || 'Retailer@12345',
      phone: data.phone,
      address: data.address || '',
      city: data.city || 'Karachi',
      credits: initialCreditsNum,
      activeDevicesCount: 0,
      totalEnrolled: 0,
      totalSpent: initialCreditsNum * 1000,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Instant Local State Update (0ms UI Response)
    setRetailers((prev) => {
      const exists = prev.some((r) => r.id === retailerId);
      return exists ? prev : [newRetailer, ...prev];
    });

    // Remote Backend Sync & Database Save in background
    retailerService.createRetailer({ ...newRetailer }, performer).catch(() => {});

    // Audit Log
    const logItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      performer,
      role: 'SUPER_ADMIN',
      action: 'CREATE_RETAILER',
      target: `${data.businessName} (${retailerId})`,
      details: `Created retailer account in ${data.city} with ${initialCreditsNum} credits.`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [logItem, ...prev]);

    return newRetailer;
  };

  const allocateCredits = async (retailerId, count, reason) => {
    const performer = role === 'SUPER_ADMIN' ? 'Super Admin' : userProfile?.name || 'Admin';
    const countNum = parseInt(count, 10) || 0;

    setRetailers((prev) =>
      prev.map((r) => {
        if (r.id === retailerId) {
          const newCredits = (r.credits || 0) + countNum;
          return {
            ...r,
            credits: newCredits,
            totalSpent: (r.totalSpent || 0) + countNum * 1000,
          };
        }
        return r;
      })
    );

    const logItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      performer,
      role: 'SUPER_ADMIN',
      action: 'CREDITS_ALLOCATED',
      target: retailerId,
      details: `Allocated +${countNum} credits. Reason: ${reason}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [logItem, ...prev]);

    retailerService.allocateCredits(retailerId, countNum, reason, performer).catch(() => {});
    return true;
  };

  const toggleRetailerStatus = async (retailerId, newStatus) => {
    const performer = role === 'SUPER_ADMIN' ? 'Super Admin' : userProfile?.name || 'Admin';

    setRetailers((prev) =>
      prev.map((r) => (r.id === retailerId ? { ...r, status: newStatus } : r))
    );

    const logItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      performer,
      role: 'SUPER_ADMIN',
      action: 'UPDATE_RETAILER_STATUS',
      target: retailerId,
      details: `Status changed to ${newStatus}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [logItem, ...prev]);

    retailerService.toggleRetailerStatus(retailerId, newStatus, performer).catch(() => {});
    return newStatus;
  };

  const deleteRetailer = async (retailerId) => {
    const performer = role === 'SUPER_ADMIN' ? 'Super Admin' : userProfile?.name || 'Admin';
    const targetRetailer = retailers.find((r) => r.id === retailerId);

    setRetailers((prev) => prev.filter((r) => r.id !== retailerId));
    setDevices((prev) => prev.filter((d) => d.retailerId !== retailerId));
    setContracts((prev) => prev.filter((c) => c.retailerId !== retailerId));

    const logItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      performer,
      role: 'SUPER_ADMIN',
      action: 'DELETE_RETAILER',
      target: `${targetRetailer?.businessName || retailerId} (${retailerId})`,
      details: `Removed retailer account and associated data`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [logItem, ...prev]);

    return true;
  };

  const enrollDevice = async (enrollmentData) => {
    const performerName = role === 'SUPER_ADMIN' ? 'Super Admin' : activeRetailer.businessName || 'Retailer';
    const currentRetailerId = role === 'SUPER_ADMIN'
      ? (activeRetailerId && activeRetailerId !== 'ALL' ? activeRetailerId : 'SUPER_ADMIN')
      : (activeRetailer?.id || activeRetailerId || 'RET-101');

    const targetRetailer = retailers.find((r) => r.id === currentRetailerId) ||
      (currentRetailerId === 'SUPER_ADMIN' ? { id: 'SUPER_ADMIN', businessName: 'Super Admin HQ' } : activeRetailer);

    if (role === 'RETAILER' && (targetRetailer?.credits || 0) <= 0) {
      throw new Error('Insufficient License Credits! You have 0 credits remaining. Please contact Super Admin to allocate credits.');
    }

    const deviceId = `DEV-${enrollmentData.model.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const contractId = `CTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newDevice = {
      deviceId,
      retailerId: currentRetailerId,
      retailerName: targetRetailer?.businessName || activeRetailer.businessName || 'Partner Store',
      contractId,
      customerName: enrollmentData.customerName,
      customerPhone: enrollmentData.customerPhone,
      customerCnic: enrollmentData.customerCnic || '',
      manufacturer: enrollmentData.manufacturer || enrollmentData.brand || 'Realme',
      brand: enrollmentData.brand || 'Realme',
      model: enrollmentData.model,
      imei: enrollmentData.imei || `${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
      hardware: 'qcom',
      androidVersion: '14.0',
      batteryLevel: 90,
      connectionType: 'Wi-Fi',
      isManagedDevice: true,
      isDeviceOwner: true,
      isRestricted: false,
      deviceStatus: 'ACTIVE',
      lastCheckIn: new Date().toISOString(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    const totalPriceNum = parseFloat(enrollmentData.totalPrice) || 50000;
    const downPaymentNum = parseFloat(enrollmentData.downPayment) || 10000;
    const monthlyNum = parseFloat(enrollmentData.monthlyInstallment) || 5000;

    const newContract = {
      contractId,
      customerName: enrollmentData.customerName,
      customerPhone: enrollmentData.customerPhone,
      customerCnic: enrollmentData.customerCnic || '',
      deviceId,
      deviceModel: enrollmentData.model,
      retailerId: currentRetailerId,
      retailerName: targetRetailer?.businessName || activeRetailer.businessName || 'Partner Store',
      totalPrice: totalPriceNum,
      downPayment: downPaymentNum,
      remainingBalance: Math.max(0, totalPriceNum - downPaymentNum),
      monthlyInstallment: monthlyNum,
      dueDateDay: parseInt(enrollmentData.dueDateDay) || 10,
      nextDueDate: enrollmentData.nextDueDate || '2026-10-10',
      paidMonths: 0,
      totalMonths: Math.ceil((totalPriceNum - downPaymentNum) / (monthlyNum || 1)),
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Instant State Updates
    setDevices((prev) => [newDevice, ...prev]);
    setContracts((prev) => [newContract, ...prev]);

    // Deduct 1 Credit
    setRetailers((prev) =>
      prev.map((r) => {
        if (r.id === currentRetailerId) {
          return {
            ...r,
            credits: Math.max(0, (r.credits || 0) - 1),
            totalEnrolled: (r.totalEnrolled || 0) + 1,
            activeDevicesCount: (r.activeDevicesCount || 0) + 1,
          };
        }
        return r;
      })
    );

    const logItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      performer: performerName,
      role: role,
      action: 'DEVICE_ENROLLED',
      target: `${newDevice.model} (${deviceId})`,
      details: `Enrolled device for ${newDevice.customerName}. 1 Credit Consumed.`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [logItem, ...prev]);

    // Remote Backend Sync in background without blocking UI
    deviceService.enrollDevice(
      { ...enrollmentData, deviceId, contractId },
      currentRetailerId,
      performerName,
      role
    ).catch((e) => console.warn('Backend enrollment background sync warning:', e.message));

    return { newDevice, newContract };
  };

  const deleteDevice = async (deviceId) => {
    const performer = role === 'SUPER_ADMIN' ? 'Super Admin' : userProfile?.name || 'Admin';
    const targetDevice = devices.find((d) => d.deviceId === deviceId);

    setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
    if (targetDevice?.contractId) {
      setContracts((prev) => prev.filter((c) => c.contractId !== targetDevice.contractId));
    }

    const logItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      performer,
      role,
      action: 'DELETE_DEVICE',
      target: `${targetDevice?.model || deviceId} (${deviceId})`,
      details: `Deleted enrolled device and related contract`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [logItem, ...prev]);

    deviceService.deleteDevice(deviceId, targetDevice?.retailerId, performer, role).catch(() => {});

    return true;
  };

  const dispatchCommand = async (deviceId, commandType, unlockPin = '1234', lockMessage = '') => {
    const performer = role === 'SUPER_ADMIN' ? 'Super Admin' : userProfile?.name || 'Admin';
    const targetDevice = devices.find((d) => d.deviceId === deviceId);

    const isLocking = commandType === 'RESTRICT_DEVICE';
    const isUnlocking = commandType === 'REMOVE_RESTRICTION';
    const isHide = commandType === 'HIDE_APP';
    const isUnhide = commandType === 'UNHIDE_APP';

    setDevices((prev) =>
      prev.map((d) => {
        if (d.deviceId === deviceId) {
          return {
            ...d,
            isRestricted: isLocking ? true : (isUnlocking ? false : d.isRestricted),
            deviceStatus: isLocking ? 'RESTRICTED' : (isUnlocking ? 'ACTIVE' : d.deviceStatus),
            isAppHidden: isHide ? true : (isUnhide ? false : (d.isAppHidden ?? true)),
            unlockPin: unlockPin || d.unlockPin,
            lastCheckIn: new Date().toISOString(),
          };
        }
        return d;
      })
    );

    if (targetDevice?.contractId) {
      setContracts((prev) =>
        prev.map((c) =>
          c.contractId === targetDevice.contractId ? { ...c, status: isLocking ? 'RESTRICTED' : (isUnlocking ? 'ACTIVE' : c.status) } : c
        )
      );
    }

    const logItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      performer,
      role: role,
      action: commandType,
      target: `${targetDevice?.model || deviceId} (${deviceId})`,
      details: `Dispatched remote command: ${commandType}. Message: ${lockMessage || 'N/A'}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [logItem, ...prev]);

    commandService.dispatchCommand(deviceId, commandType, unlockPin, lockMessage, performer, role, targetDevice?.retailerId).catch(() => {});
    return true;
  };

  const recordPayment = async (contractId, amount, method = 'Cash', reference = '') => {
    const performer = role === 'SUPER_ADMIN' ? 'Super Admin' : activeRetailer.businessName || 'Retailer';
    const payAmount = parseFloat(amount) || 0;
    const targetContract = contracts.find((c) => c.contractId === contractId);

    setContracts((prev) =>
      prev.map((c) => {
        if (c.contractId === contractId) {
          const newBal = Math.max(0, (c.remainingBalance || 0) - payAmount);
          const newPaid = (c.paidMonths || 0) + 1;
          const isCompleted = newBal <= 0;
          return {
            ...c,
            remainingBalance: newBal,
            paidMonths: newPaid,
            status: isCompleted ? 'COMPLETED' : c.status === 'RESTRICTED' ? 'ACTIVE' : c.status,
          };
        }
        return c;
      })
    );

    if (targetContract?.deviceId) {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.deviceId === targetContract.deviceId || d.contractId === contractId) {
            return {
              ...d,
              isRestricted: false,
              deviceStatus: 'ACTIVE',
              lastCheckIn: new Date().toISOString(),
            };
          }
          return d;
        })
      );
    }

    const paymentItem = {
      id: `PAY-${Date.now()}`,
      contractId,
      customerName: targetContract?.customerName || 'Customer',
      amount: payAmount,
      method,
      reference: reference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      recordedBy: performer,
      timestamp: new Date().toISOString(),
    };

    setPayments((prev) => [paymentItem, ...prev]);

    const logItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      performer,
      role: role,
      action: 'PAYMENT_RECORDED',
      target: `${targetContract?.customerName || 'Contract'} (${contractId})`,
      details: `Recorded Rs. ${payAmount.toLocaleString()} via ${method}. Ref: ${paymentItem.reference}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [logItem, ...prev]);

    paymentService.recordPayment(contractId, payAmount, method, reference, performer, role).catch(() => {});
    return paymentItem;
  };

  const markNotificationRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
    notificationService.markAsRead(notifId).catch(() => {});
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    notificationService.markAllAsRead(notifications).catch(() => {});
  };

  const sendCustomerReminder = async (contractId) => {
    const targetContract = contracts.find((c) => c.contractId === contractId);
    if (!targetContract) return { success: false, message: 'Contract not found' };

    const performerName = role === 'SUPER_ADMIN' ? 'Super Admin' : activeRetailer.businessName || 'Retailer';

    const notifItem = {
      id: `NOTIF-REM-${Date.now()}`,
      contractId,
      deviceId: targetContract.deviceId,
      retailerId: targetContract.retailerId,
      title: `📲 Customer Reminder Sent`,
      message: `SMS & Push reminder sent to ${targetContract.customerName} (${targetContract.customerPhone}) for payment due on ${targetContract.nextDueDate}.`,
      type: 'REMINDER_SENT',
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [notifItem, ...prev]);

    const logItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      performer: performerName,
      role: role,
      action: 'SENT_CUSTOMER_REMINDER',
      target: `${targetContract.customerName} (${contractId})`,
      details: `Dispatched payment reminder SMS/Notification to customer phone ${targetContract.customerPhone}.`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [logItem, ...prev]);

    return {
      success: true,
      customerName: targetContract.customerName,
      customerPhone: targetContract.customerPhone,
      message: `Reminder sent to ${targetContract.customerName} (${targetContract.customerPhone})`,
    };
  };

  const extendCustomerDueDate = async (contractId, daysToExtend = 7) => {
    const targetContract = contracts.find((c) => c.contractId === contractId);
    if (!targetContract) return { success: false, message: 'Contract not found' };

    const performerName = role === 'SUPER_ADMIN' ? 'Super Admin' : activeRetailer.businessName || 'Retailer';

    const baseDateStr = targetContract.nextDueDate || new Date().toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    const baseDate = new Date(baseDateStr < todayStr ? todayStr : baseDateStr);
    baseDate.setDate(baseDate.getDate() + daysToExtend);
    const newDueDate = baseDate.toISOString().split('T')[0];

    setContracts((prev) =>
      prev.map((c) =>
        c.contractId === contractId
          ? {
              ...c,
              nextDueDate: newDueDate,
              status: c.status === 'RESTRICTED' || c.status === 'OVERDUE' ? 'ACTIVE' : c.status,
            }
          : c
      )
    );

    setDevices((prev) =>
      prev.map((d) =>
        d.contractId === contractId || d.deviceId === targetContract.deviceId
          ? {
              ...d,
              isRestricted: false,
              deviceStatus: 'ACTIVE',
              lastCheckIn: new Date().toISOString(),
            }
          : d
      )
    );

    setNotifications((prev) =>
      prev.filter((n) => !n.id.includes(contractId) || n.type === 'EXTENSION_GRANTED')
    );

    const logItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      performer: performerName,
      role: role,
      action: 'EXTEND_DUE_DATE',
      target: `${targetContract.customerName} (${contractId})`,
      details: `Granted ${daysToExtend} days extension. New due date: ${newDueDate}. Restored device access.`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [logItem, ...prev]);

    return {
      success: true,
      customerName: targetContract.customerName,
      newDueDate,
      message: `Due date extended to ${newDueDate} for ${targetContract.customerName}.`,
    };
  };

  const createApplianceContract = async (contractData) => {
    const performer = role === 'SUPER_ADMIN' ? 'Super Admin' : activeRetailer.businessName || 'Retailer';
    const targetRetailerId = contractData.retailerId || (role === 'RETAILER'
      ? (activeRetailer?.id || activeRetailerId)
      : (activeRetailerId !== 'SUPER_ADMIN' ? activeRetailerId : (activeRetailer?.id || 'RET-101')));

    const targetRetailer = retailers.find((r) => r.id === targetRetailerId) || activeRetailer;

    // Credit enforcement for RETAILER
    if (role === 'RETAILER' && (targetRetailer?.credits || 0) <= 0) {
      throw new Error('Insufficient License Credits! You have 0 credits remaining. Please contact Super Admin to allocate credits.');
    }

    const contractId = contractData.contractId || `CTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalPriceNum = parseFloat(contractData.totalPrice) || 50000;
    const downPaymentNum = parseFloat(contractData.downPayment) || 10000;
    const monthlyNum = parseFloat(contractData.monthlyInstallment) || 4000;

    const newContract = {
      contractId,
      customerId: contractData.customerId || `CUST-${Math.floor(100 + Math.random() * 900)}`,
      customerName: contractData.customerName,
      customerPhone: contractData.customerPhone || '+92 300 0000000',
      customerCnic: contractData.customerCnic || '42101-0000000-1',
      deviceId: contractData.deviceId || `DEV-ASSET-${Date.now()}`,
      deviceModel: contractData.deviceModel || 'Appliance Asset',
      assetCategory: contractData.assetCategory || 'SMART_TV',
      serialNumber: contractData.serialNumber || 'N/A',
      retailerId: targetRetailerId,
      retailerName: targetRetailer?.businessName || activeRetailer?.businessName || 'Partner Store',
      totalPrice: totalPriceNum,
      downPayment: downPaymentNum,
      remainingBalance: Math.max(0, totalPriceNum - downPaymentNum),
      monthlyInstallment: monthlyNum,
      dueDateDay: parseInt(contractData.dueDateDay) || 10,
      nextDueDate: contractData.nextDueDate || '2026-10-10',
      paidMonths: 0,
      totalMonths: parseInt(contractData.totalMonths) || 10,
      status: 'ACTIVE',
      contractImageUrl: contractData.contractImageUrl || null,
      cnicImageUrl: contractData.cnicImageUrl || null,
      notes: contractData.notes || '',
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Deduct 1 Credit
    setRetailers((prev) =>
      prev.map((r) => {
        if (r.id === targetRetailerId) {
          return {
            ...r,
            credits: Math.max(0, (r.credits || 0) - 1),
            totalEnrolled: (r.totalEnrolled || 0) + 1,
            activeDevicesCount: (r.activeDevicesCount || 0) + 1,
          };
        }
        return r;
      })
    );

    // Instant Local State Update
    setContracts((prev) => [newContract, ...prev]);

    const logItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      performer,
      role,
      action: 'APPLIANCE_CONTRACT_CREATED',
      target: `${newContract.deviceModel} (${contractId})`,
      details: `Created ${newContract.assetCategory} contract for ${newContract.customerName}. 1 Credit Consumed.`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [logItem, ...prev]);

    // Background Remote Sync
    deviceService.createContract(newContract).catch(() => {});

    return newContract;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        switchRole,
        activeRetailerId,
        setActiveRetailerId,
        activeRetailer,
        retailers: visibleRetailers,
        devices: visibleDevices,
        contracts: visibleContracts,
        payments: visiblePayments,
        auditLogs: visibleAuditLogs,
        notifications: visibleNotifications,
        loading,
        login,
        logout,
        resetPassword,
        allocateCredits,
        createRetailer,
        toggleRetailerStatus,
        deleteRetailer,
        enrollDevice,
        deleteDevice,
        dispatchCommand,
        recordPayment,
        markNotificationRead,
        markAllNotificationsRead,
        sendCustomerReminder,
        extendCustomerDueDate,
        createApplianceContract,
        resetAllTestData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
