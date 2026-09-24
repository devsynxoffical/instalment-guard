import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { commandService } from '../services/commandService';
import { PageHeader } from '../components/PageHeader';
import { ConfirmModal } from '../components/ConfirmModal';
import { getDevicePaymentStatus } from '../utils/paymentHelper';
import {
  Smartphone,
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  BatteryCharging,
  Wifi,
  HardDrive,
  Cpu,
  MapPin,
  Clock,
  History,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Trash2,
  Building2,
  Key,
  Flame,
  X,
  FileText,
  Calendar,
  DollarSign,
  User,
  Phone,
  Edit3,
} from 'lucide-react';
import { deviceService } from '../services/deviceService';

import { API_BASE_URL } from '../config/api';

export const DeviceDetailPage = () => {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { devices, contracts, retailers, deleteDevice, currentUser, role } = useAuth();
  const { showToast } = useToast();

  const [liveDeviceData, setLiveDeviceData] = useState(null);

  useEffect(() => {
    if (!deviceId) return;
    const fetchLive = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/devices/${encodeURIComponent(deviceId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setLiveDeviceData(json.data);
          }
        }
      } catch (_) {}
    };
    fetchLive();
    const timer = setInterval(fetchLive, 2000);
    return () => clearInterval(timer);
  }, [deviceId]);

  const device = liveDeviceData || devices.find((d) => d.deviceId === deviceId) || devices[0];
  const payInfo = getDevicePaymentStatus(device, contracts);
  const contract = payInfo.contract || {};
  const store = (retailers || []).find((r) => r.id === device?.retailerId);
  const rawSeller = device?.retailerName || contract?.retailerName || store?.businessName || '';
  const sellerName = (rawSeller && rawSeller !== 'Lahore Electronics Hub') ? rawSeller : 'Registered Retailer Store';

  const [commandHistory, setCommandHistory] = useState([]);
  const [loadingCmd, setLoadingCmd] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);

  // Custom PIN Lock Modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [customPin, setCustomPin] = useState(device?.unlockPin || '1234');
  const [lockMsg, setLockMsg] = useState('Installment Overdue: Please contact store to pay.');

  // Edit Installment Plan & Contract Modal state
  const [showContractModal, setShowContractModal] = useState(false);
  const [savingContract, setSavingContract] = useState(false);
  const [contractForm, setContractForm] = useState({
    customerName: '',
    customerPhone: '',
    customerCnic: '',
    totalPrice: 60000,
    downPayment: 15000,
    totalMonths: 6,
    monthlyInstallment: 7500,
    dueDateDay: 5,
    nextDueDate: '',
    unlockPin: '1234',
    notes: '',
  });

  const openContractModal = () => {
    const defaultTotal = contract.totalPrice || device?.totalPrice || 60000;
    const defaultDown = contract.downPayment || device?.downPayment || 15000;
    const defaultMonths = contract.totalMonths || 6;
    const defaultRemaining = Math.max(0, defaultTotal - defaultDown);
    const defaultMonthly = contract.monthlyInstallment || (defaultMonths > 0 ? Math.round(defaultRemaining / defaultMonths) : defaultRemaining);

    setContractForm({
      customerName: contract.customerName || device?.customerName || 'Customer',
      customerPhone: contract.customerPhone || device?.customerPhone || '+92 300 1234567',
      customerCnic: contract.customerCnic || device?.customerCnic || '42101-1234567-1',
      retailerId: device?.retailerId || contract.retailerId || currentUser?.retailerId || 'RET-101',
      totalPrice: defaultTotal,
      downPayment: defaultDown,
      totalMonths: defaultMonths,
      monthlyInstallment: defaultMonthly,
      dueDateDay: contract.dueDateDay || 5,
      nextDueDate: contract.nextDueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      unlockPin: device?.unlockPin || '1234',
      notes: contract.notes || '',
    });
    setShowContractModal(true);
  };

  const handleContractFormChange = (field, value) => {
    setContractForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'totalPrice' || field === 'downPayment' || field === 'totalMonths') {
        const total = field === 'totalPrice' ? parseFloat(value) || 0 : prev.totalPrice;
        const down = field === 'downPayment' ? parseFloat(value) || 0 : prev.downPayment;
        const months = field === 'totalMonths' ? parseInt(value) || 1 : prev.totalMonths;
        const rem = Math.max(0, total - down);
        updated.monthlyInstallment = months > 0 ? Math.round(rem / months) : rem;
      }
      return updated;
    });
  };

  const handleSaveContract = async (e) => {
    e.preventDefault();
    setSavingContract(true);
    try {
      const payload = {
        ...contractForm,
        performerName: currentUser?.name || 'Admin',
        role: role || 'RETAILER',
      };
      const res = await fetch(`${API_BASE_URL}/api/devices/${encodeURIComponent(device.deviceId)}/contract`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Installment plan & contract updated successfully!', 'success');
        setShowContractModal(false);
        if (data.data?.device) {
          setLiveDeviceData(data.data.device);
        }
      } else {
        showToast(data.message || 'Failed to update contract', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error updating contract', 'error');
    } finally {
      setSavingContract(false);
    }
  };

  useEffect(() => {
    if (device?.deviceId) {
      const unsub = commandService.subscribeCommandHistory(device.deviceId, (logs) => {
        setCommandHistory(logs);
      });
      return () => unsub();
    }
  }, [device?.deviceId]);

  if (!device) {
    return (
      <div className="page-container py-12 text-center text-slate-500 font-sans">
        Device not found.{' '}
        <button onClick={() => navigate('/devices')} className="text-teal-700 font-bold underline">
          Back to Devices
        </button>
      </div>
    );
  }

  const totalPrice = contract.totalPrice || 45000;
  const remainingBal = contract.remainingBalance ?? payInfo.remaining;
  const totalPaid = Math.max(0, totalPrice - remainingBal);
  const paidPercent = Math.min(100, Math.round((totalPaid / totalPrice) * 100));

  const handleTriggerCommand = (commandType, pinVal = null) => {
    let title = 'Confirm Command Dispatch';
    let message = `Are you sure you want to execute command "${commandType}" on this device?`;
    let isDanger = false;

    if (commandType === 'RESTRICT_DEVICE' || commandType === 'LOCK_DEVICE') {
      title = `Restrict & Lock Device with PIN (${pinVal || customPin})`;
      message = `This will lock the Android phone and display the lock screen keypad with PIN: ${pinVal || customPin}. Continue?`;
      isDanger = true;
    } else if (commandType === 'REMOVE_RESTRICTION' || commandType === 'UNLOCK_DEVICE') {
      title = 'Remove Restriction & Unlock Device';
      message = 'This will send an unlock command to restore full phone access. Continue?';
    } else if (commandType === 'WIPE_DEVICE') {
      title = 'Remote Wipe / Uninstall MDM Package';
      message = 'CRITICAL WARNING: This will remotely reset MDM policies and uninstall protection package. Continue?';
      isDanger = true;
    }

    setConfirmModalData({ commandType, title, message, isDanger, pinVal: pinVal || customPin });
  };

  const handleExecuteConfirmedCommand = async () => {
    if (!confirmModalData) return;
    const { commandType, pinVal } = confirmModalData;

    setLoadingCmd(true);
    try {
      await deviceService.dispatchCommand(device.deviceId, commandType, pinVal, lockMsg);
      showToast(`Command ${commandType} dispatched successfully!`, 'success');
      setConfirmModalData(null);
      setShowPinModal(false);
    } catch (err) {
      showToast('Failed to dispatch command.', 'error');
    } finally {
      setLoadingCmd(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!device) return;
    if (window.confirm(`Are you sure you want to remove device "${device.model}" (${device.customerName || 'Customer'})? This will also remove the contract record.`)) {
      try {
        await deleteDevice(device.deviceId);
        showToast('Device and contract record deleted successfully', 'success');
        navigate('/devices');
      } catch (err) {
        showToast('Failed to remove device.', 'error');
      }
    }
  };

  return (
    <div className="page-container space-y-6 animate-fade-in font-sans">
      <PageHeader
        breadcrumbs={[{ label: 'Devices', path: '/devices' }, { label: device.deviceId }]}
        title={device.model}
        description={`Device ID: ${device.deviceId} • IMEI: ${device.imei || 'N/A'}`}
        action={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={openContractModal}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Edit3 className="w-4 h-4 shrink-0" />
              <span>Edit Installment Plan</span>
            </button>

            <button
              onClick={() => setShowPinModal(true)}
              className="btn-danger font-bold text-xs py-2 px-3.5 inline-flex items-center gap-2 whitespace-nowrap bg-rose-600 hover:bg-rose-700"
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Lock with Custom PIN</span>
            </button>

            <button
              onClick={() => handleTriggerCommand('REMOVE_RESTRICTION')}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700 font-bold text-xs py-2 px-3.5 inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Unlock className="w-4 h-4 shrink-0" />
              <span>Unlock Device</span>
            </button>

            <button
              onClick={handleDeleteDevice}
              className="px-3.5 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4 shrink-0" /> <span>Delete</span>
            </button>
          </div>
        }
      />

      {/* Main Header Card */}
      <div className="teal-card p-4 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 sm:p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 shrink-0">
              <Smartphone className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 break-words">{device.model}</h2>
                <span
                  className={`badge font-bold text-[11px] ${
                    device.isRestricted ? 'badge-danger' : 'badge-success'
                  }`}
                >
                  {device.isRestricted ? 'RESTRICTED (LOCKED)' : 'ACTIVE (UNLOCKED)'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-mono text-xs font-bold flex items-center gap-1">
                  <Key className="w-3 h-3 text-indigo-600" /> Unlock PIN: {device.unlockPin || '1234'}
                </span>
              </div>
              <p className="text-slate-500 text-xs break-words">
                Customer: <strong className="text-slate-900">{device.customerName}</strong> ({device.customerPhone})
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  Sold By: {sellerName} {device?.retailerId && device.retailerId !== 'RET-101' ? `(${device.retailerId})` : ''}
                </span>
                <span className="text-slate-500 text-xs font-mono">Contract: {device.contractId || contract.contractId || 'CTR-2026-9001'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Battery Level</span>
              <div className="flex items-center gap-2 font-bold text-emerald-600 text-sm">
                <BatteryCharging className="w-4 h-4" /> {device.batteryLevel || 85}%
              </div>
            </div>
            <div className="pt-2 sm:pt-0 sm:pl-6 space-y-1">
              <span className="text-slate-500 font-medium">Connection</span>
              <div className="flex items-center gap-2 font-bold text-sky-600 text-sm">
                <Wifi className="w-4 h-4" /> {device.connectionType || 'Wi-Fi'}
              </div>
            </div>
            <div className="pt-2 sm:pt-0 sm:pl-6 space-y-1">
              <span className="text-slate-500 font-medium">Last Check-In</span>
              <div className="flex items-center gap-2 text-slate-700 font-mono text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {new Date(device.lastCheckIn || Date.now()).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Installment Payment Status Card */}
      <div className="teal-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Device Payment State</div>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${payInfo.badgeClass}`}>
                {payInfo.status === 'PAID' && <CheckCircle2 className="w-4 h-4" />}
                {payInfo.status === 'PENDING' && <Clock className="w-4 h-4" />}
                {payInfo.status === 'OVERDUE' && <AlertTriangle className="w-4 h-4" />}
                {payInfo.label}
              </span>
              <span className="text-sm font-bold text-slate-700">
                {payInfo.subLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={openContractModal}
              className="py-2 px-3.5 text-xs font-bold rounded-xl bg-teal-50 border border-teal-300 text-teal-800 hover:bg-teal-100 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <FileText className="w-4 h-4 text-teal-700" /> Edit Plan & Customer Details
            </button>

            <button
              onClick={() => navigate('/payments/new')}
              className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Record Installment Payment
            </button>
          </div>
        </div>

        {/* Progress Bar & Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Payment Progress ({paidPercent}% Collected)</span>
            <span>Total: Rs. {totalPrice.toLocaleString()}</span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                payInfo.status === 'PAID'
                  ? 'bg-emerald-600'
                  : payInfo.status === 'OVERDUE'
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${paidPercent}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-medium">Total Price</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">Rs. {totalPrice.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-medium">Amount Paid</div>
              <div className="font-bold text-emerald-700 text-sm mt-0.5">Rs. {totalPaid.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-medium">Remaining Due</div>
              <div className="font-bold text-rose-700 text-sm mt-0.5">Rs. {remainingBal.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-medium">Monthly Installment</div>
              <div className="font-bold text-teal-800 text-sm mt-0.5">Rs. {(contract.monthlyInstallment || 5000).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Remote Control Dispatcher Bar */}
      <div className="teal-card p-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Admin Direct Remote Control Suite:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleTriggerCommand('SYNC_DEVICE')}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-700" /> Force Sync
          </button>

          <button
            onClick={() => handleTriggerCommand('HIDE_APP')}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            <EyeOff className="w-3.5 h-3.5 text-amber-600" /> Hide App Launcher
          </button>

          <button
            onClick={() => handleTriggerCommand('UNHIDE_APP')}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" /> Unhide App Launcher
          </button>

          <button
            onClick={() => handleTriggerCommand('WIPE_DEVICE')}
            className="py-1.5 px-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" /> Remote Wipe / Uninstall
          </button>
        </div>
      </div>

      {/* Grid Hardware Telemetry & GPS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="teal-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-700" /> Hardware & Android OS
          </h3>
          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Android Version</span>
              <span className="text-slate-900 font-medium">{device.androidVersion || 'Pending Live Sync'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Security Patch</span>
              <span className="text-slate-900 font-medium">{device.securityPatch || 'Pending Live Sync'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Screen Resolution</span>
              <span className="text-slate-900 font-medium">{device.resolution || 'Pending Live Sync'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">RAM Memory</span>
              <span className="text-slate-900 font-medium">
                {device.availRamMb != null && device.totalRamMb != null
                  ? `${device.availRamMb} MB free / ${device.totalRamMb} MB`
                  : 'Pending Live Sync'}
              </span>
            </div>
          </div>
        </div>

        <div className="teal-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-sky-600" /> Storage & Network IP
          </h3>
          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Total Storage</span>
              <span className="text-slate-900 font-medium">{device.totalStorageGb ? `${device.totalStorageGb} GB` : 'Pending Live Sync'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Available Storage</span>
              <span className="text-emerald-700 font-medium">{device.availStorageGb ? `${device.availStorageGb} GB` : 'Pending Live Sync'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">IP Address</span>
              <span className="text-slate-900 font-mono">{device.ipAddress || 'Pending Live Sync'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Device Owner Mode</span>
              <span className="badge badge-success text-[10px]">ENFORCED</span>
            </div>
          </div>
        </div>

        <div className="teal-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" /> GPS Location Pin
          </h3>
          <div className="text-xs space-y-2">
            <div className="p-3 bg-slate-50 rounded-lg font-mono text-slate-700 flex justify-between border border-slate-200">
              <span>LAT: {device.latitude != null ? device.latitude : 'N/A'}</span>
              <span>LNG: {device.longitude != null ? device.longitude : 'N/A'}</span>
            </div>
            {device.latitude != null && device.longitude != null ? (
              <a
                href={`https://maps.google.com/?q=${device.latitude},${device.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center justify-center gap-2 border border-amber-200 transition-colors"
              >
                <MapPin className="w-4 h-4" /> Open in Google Maps
              </a>
            ) : (
              <div className="text-center py-2 text-slate-400 text-xs font-mono">GPS Location Syncing...</div>
            )}
          </div>
        </div>
      </div>

      {/* Command Timeline History */}
      <div className="teal-card p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-teal-700" /> Remote Command History Timeline
        </h3>

        <div className="space-y-3">
          {commandHistory.length > 0 ? (
            commandHistory.map((cmd) => (
              <div
                key={cmd.commandId || cmd.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{cmd.commandType}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{cmd.details}</div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span
                    className={`badge ${
                      cmd.status === 'EXECUTED'
                        ? 'badge-success'
                        : cmd.status === 'FAILED'
                        ? 'badge-danger'
                        : 'badge-warning'
                    }`}
                  >
                    {cmd.status || 'EXECUTED'}
                  </span>
                  <div className="text-slate-400 font-mono text-[11px]">
                    {new Date(cmd.requestedAt || cmd.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No previous security commands logged for this device.
            </div>
          )}
        </div>
      </div>

      {/* Custom PIN Lock Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-500" /> Custom PIN Remote Lock
              </h3>
              <button onClick={() => setShowPinModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Set 4-Digit Unlock PIN *</label>
                <input
                  type="text"
                  maxLength={6}
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value)}
                  className="input-field font-mono text-center text-xl font-bold tracking-widest text-indigo-400"
                  placeholder="4921"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Customer can enter this exact PIN on the phone's lock screen keypad after paying installment.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Lock Screen Message</label>
                <textarea
                  rows={2}
                  value={lockMsg}
                  onChange={(e) => setLockMsg(e.target.value)}
                  className="input-field text-xs"
                  placeholder="Installment Overdue: Please contact store to pay."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button onClick={() => setShowPinModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button
                  onClick={() => handleTriggerCommand('RESTRICT_DEVICE', customPin)}
                  className="btn-danger bg-rose-600 hover:bg-rose-700 text-xs px-5 font-bold"
                >
                  Dispatch PIN Lock Command
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Installment Plan & Contract Modal */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 sm:p-7 space-y-5 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Edit Installment Contract & Plan
                  </h3>
                  <p className="text-xs text-slate-400">Update pricing, customer details, tenure, and payment terms</p>
                </div>
              </div>
              <button
                onClick={() => setShowContractModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="space-y-4">
              {/* Customer Details Section */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Customer Information
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={contractForm.customerName}
                      onChange={(e) => handleContractFormChange('customerName', e.target.value)}
                      className="input-field text-xs"
                      placeholder="e.g. Muhammad Ali"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Customer Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={contractForm.customerPhone}
                      onChange={(e) => handleContractFormChange('customerPhone', e.target.value)}
                      className="input-field text-xs"
                      placeholder="+92 300 1234567"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Customer CNIC Number</label>
                    <input
                      type="text"
                      value={contractForm.customerCnic}
                      onChange={(e) => handleContractFormChange('customerCnic', e.target.value)}
                      className="input-field text-xs"
                      placeholder="42101-1234567-1"
                    />
                  </div>
                </div>
              </div>

              {/* Installment Pricing & Plan Section */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> Pricing & Installment Schedule
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Total Price (PKR) *</label>
                    <input
                      type="number"
                      required
                      min={1000}
                      value={contractForm.totalPrice}
                      onChange={(e) => handleContractFormChange('totalPrice', e.target.value)}
                      className="input-field text-xs font-bold text-emerald-400 font-mono"
                      placeholder="60000"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Down Payment (PKR) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={contractForm.downPayment}
                      onChange={(e) => handleContractFormChange('downPayment', e.target.value)}
                      className="input-field text-xs font-bold text-sky-400 font-mono"
                      placeholder="15000"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tenure (Months) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={48}
                      value={contractForm.totalMonths}
                      onChange={(e) => handleContractFormChange('totalMonths', e.target.value)}
                      className="input-field text-xs font-bold text-indigo-400 font-mono"
                      placeholder="6"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Monthly Installment (PKR)</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={contractForm.monthlyInstallment}
                      onChange={(e) => handleContractFormChange('monthlyInstallment', e.target.value)}
                      className="input-field text-xs font-bold text-amber-400 font-mono"
                      placeholder="7500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Due Day of Month (1-31)</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={contractForm.dueDateDay}
                      onChange={(e) => handleContractFormChange('dueDateDay', e.target.value)}
                      className="input-field text-xs font-mono"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Next Due Date *</label>
                    <input
                      type="date"
                      required
                      value={contractForm.nextDueDate}
                      onChange={(e) => handleContractFormChange('nextDueDate', e.target.value)}
                      className="input-field text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Default Unlock PIN</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={contractForm.unlockPin}
                      onChange={(e) => handleContractFormChange('unlockPin', e.target.value)}
                      className="input-field text-xs font-mono text-center font-bold text-indigo-400"
                      placeholder="1234"
                    />
                  </div>
                </div>
              </div>

              {/* Retailer Store Assignment (Visible to Super Admin or read-only) */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-400" /> Assigned Store / Retailer
                </label>
                {role === 'SUPER_ADMIN' ? (
                  <select
                    value={contractForm.retailerId || 'RET-101'}
                    onChange={(e) => handleContractFormChange('retailerId', e.target.value)}
                    className="input-field text-xs"
                  >
                    {retailers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.businessName} ({r.id}) - {r.city}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-slate-300 font-bold px-3 py-2 bg-slate-900 rounded-xl border border-slate-800">
                    {sellerName} ({contractForm.retailerId || 'Your Store'})
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingContract}
                  className="btn-primary bg-teal-600 hover:bg-teal-700 text-xs px-5 font-bold flex items-center gap-2"
                >
                  {savingContract ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Save Installment Contract
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalData && (
        <ConfirmModal
          isOpen={!!confirmModalData}
          title={confirmModalData.title}
          message={confirmModalData.message}
          isDanger={confirmModalData.isDanger}
          loading={loadingCmd}
          onConfirm={handleExecuteConfirmedCommand}
          onClose={() => setConfirmModalData(null)}
        />
      )}
    </div>
  );
};
