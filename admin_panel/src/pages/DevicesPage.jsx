import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Smartphone, Search, PlusCircle, BatteryCharging, Wifi, ChevronRight, CheckCircle2, Clock, AlertTriangle, Trash2, Building2, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { TableSkeleton } from '../components/SkeletonLoader';
import { getDevicePaymentStatus } from '../utils/paymentHelper';

export const DevicesPage = () => {
  const navigate = useNavigate();
  const { devices, contracts, retailers, deleteDevice, dispatchCommand, loading } = useAuth();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  const handleDeleteDevice = async (e, deviceId, model, customerName) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove device "${model}" (${customerName || 'Customer'})? This will also remove the contract record.`)) {
      try {
        await deleteDevice(deviceId);
        showToast(`Device "${model}" removed successfully`, 'success');
      } catch (err) {
        showToast('Failed to remove device.', 'error');
      }
    }
  };

  const handleToggleHideApp = async (e, dev) => {
    e.stopPropagation();
    const commandType = dev.isAppHidden ? 'UNHIDE_APP' : 'HIDE_APP';
    try {
      await dispatchCommand(dev.deviceId, commandType);
      showToast(dev.isAppHidden ? `👁️ Unhide App command sent to ${dev.model}` : `🙈 Hide App command sent to ${dev.model}`, 'success');
    } catch (err) {
      showToast('Failed to send hide/unhide command', 'error');
    }
  };

  const handleToggleLock = async (e, dev) => {
    e.stopPropagation();
    const commandType = dev.isRestricted ? 'REMOVE_RESTRICTION' : 'RESTRICT_DEVICE';
    try {
      await dispatchCommand(dev.deviceId, commandType);
      showToast(dev.isRestricted ? `🔓 Device unrestricted: ${dev.model}` : `🔒 Device restricted: ${dev.model}`, dev.isRestricted ? 'success' : 'warning');
    } catch (err) {
      showToast('Failed to toggle device restriction', 'error');
    }
  };

  const filteredDevices = devices.filter((d) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      d.deviceId.toLowerCase().includes(term) ||
      d.model.toLowerCase().includes(term) ||
      (d.customerName && d.customerName.toLowerCase().includes(term)) ||
      (d.imei && d.imei.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'RESTRICTED' && d.isRestricted) ||
      (statusFilter === 'ACTIVE' && !d.isRestricted);

    const payInfo = getDevicePaymentStatus(d, contracts);
    const matchesPayment =
      paymentFilter === 'ALL' || payInfo.status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="page-container space-y-6 animate-fade-in font-sans">
      <PageHeader
        breadcrumbs={[{ label: 'Devices' }]}
        title="Device Control Center"
        description="Manage enrolled mobile phones, monitor installment payment status, and trigger security commands"
        action={
          <button
            onClick={() => navigate('/devices/enroll')}
            className="btn-primary flex items-center gap-2 font-bold"
          >
            <PlusCircle className="w-5 h-5" /> Enroll New Device
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="teal-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search model, IMEI, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto pl-0 md:pl-6 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0">
          {/* Lock Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field cursor-pointer text-xs font-bold"
          >
            <option value="ALL">All Lock States</option>
            <option value="ACTIVE">UNLOCKED (Active)</option>
            <option value="RESTRICTED">LOCKED (Restricted)</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="input-field cursor-pointer text-xs font-bold"
          >
            <option value="ALL">All Payment States</option>
            <option value="PAID">✅ Payment Received (Paid in Full)</option>
            <option value="PENDING">⏳ Pending (Installment Remaining)</option>
            <option value="OVERDUE">⚠️ Overdue (Late Installment)</option>
          </select>
        </div>
      </div>

      {/* Devices Table */}
      <div className="teal-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={7} />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Device Model & ID</th>
                  <th className="px-6 py-4">Customer & Phone</th>
                  <th className="px-6 py-4">Retailer (Sold By)</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Lock Status</th>
                  <th className="px-6 py-4">Battery & Signal</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDevices.length > 0 ? (
                  filteredDevices.map((dev) => {
                    const payInfo = getDevicePaymentStatus(dev, contracts);
                    const storeName = retailers.find((r) => r.id === dev.retailerId)?.businessName || dev.retailerName || 'Partner Store';

                    return (
                      <tr
                        key={dev.deviceId}
                        onClick={() => navigate(`/devices/${dev.deviceId}`)}
                        className="hover:bg-teal-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors flex items-center gap-1">
                            {dev.model} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-teal-700" />
                          </div>
                          <div className="font-mono text-xs text-teal-700 mt-0.5">{dev.deviceId}</div>
                          <div className="text-[11px] text-slate-400 font-mono">IMEI: {dev.imei || 'N/A'}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{dev.customerName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{dev.customerPhone}</div>
                        </td>

                        {/* Retailer (Sold By) Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span>{storeName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {dev.retailerId || 'RET-101'}</div>
                        </td>

                        {/* Payment Status Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-block">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${payInfo.badgeClass}`}>
                              {payInfo.status === 'PAID' && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {payInfo.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                              {payInfo.status === 'OVERDUE' && <AlertTriangle className="w-3.5 h-3.5" />}
                              {payInfo.label}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-600 mt-1">
                            {payInfo.subLabel}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap space-y-1">
                          <div>
                            <span
                              className={`badge font-bold ${
                                dev.isRestricted ? 'badge-danger' : 'badge-success'
                              }`}
                            >
                              {dev.isRestricted ? 'RESTRICTED (LOCKED)' : 'ACTIVE (UNLOCKED)'}
                            </span>
                          </div>
                          <div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                                dev.isAppHidden
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {dev.isAppHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {dev.isAppHidden ? 'Launcher Hidden' : 'Launcher Visible'}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <div className="text-emerald-700 font-bold flex items-center gap-1">
                            <BatteryCharging className="w-3.5 h-3.5" /> {dev.batteryLevel || 85}% Battery
                          </div>
                          <div className="text-slate-500 mt-0.5 flex items-center gap-1 font-semibold">
                            <Wifi className="w-3.5 h-3.5 text-sky-600" /> {dev.connectionType || 'Wi-Fi'}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-1.5">
                          <button
                            onClick={(e) => handleToggleLock(e, dev)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap ${
                              dev.isRestricted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                            title={dev.isRestricted ? 'Remove Device Restriction' : 'Restrict Device Access'}
                          >
                            {dev.isRestricted ? <Unlock className="w-3.5 h-3.5 shrink-0" /> : <Lock className="w-3.5 h-3.5 shrink-0" />}
                            <span>{dev.isRestricted ? 'Unlock' : 'Lock'}</span>
                          </button>

                          <button
                            onClick={(e) => handleToggleHideApp(e, dev)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap ${
                              dev.isAppHidden
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                            }`}
                            title={dev.isAppHidden ? 'Unhide App Icon on Phone' : 'Hide App Icon on Phone'}
                          >
                            {dev.isAppHidden ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                            <span>{dev.isAppHidden ? 'Unhide App' : 'Hide App'}</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/devices/${dev.deviceId}`);
                            }}
                            className="btn-secondary py-1.5 px-3 text-xs font-bold whitespace-nowrap"
                          >
                            Details
                          </button>

                          <button
                            onClick={(e) => handleDeleteDevice(e, dev.deviceId, dev.model, dev.customerName)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                            title="Remove Device"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" /> <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                      No devices found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
