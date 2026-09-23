import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Smartphone,
  Search,
  PlusCircle,
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  BatteryCharging,
  Wifi,
} from 'lucide-react';
import { TableSkeleton } from '../components/SkeletonLoader';

export const DevicesView = ({
  onInspectTelemetry,
  onOpenCommand,
  onEnrollDevice,
  onViewDeviceDetail,
}) => {
  const { devices, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Smartphone className="w-7 h-7 text-indigo-400" /> Device Management & Control Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time telemetry, lock task controls, and component visibility for enrolled mobile phones
          </p>
        </div>

        <button
          onClick={onEnrollDevice}
          className="btn-primary flex items-center gap-2 py-2.5 px-5 shadow-lg shadow-indigo-600/30"
        >
          <PlusCircle className="w-5 h-5" /> Enroll Customer Device
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by model, IMEI, customer, device ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field cursor-pointer"
          >
            <option value="ALL">All Device States</option>
            <option value="ACTIVE">ACTIVE (UNLOCKED)</option>
            <option value="RESTRICTED">RESTRICTED (LOCKED)</option>
          </select>
        </div>
      </div>

      {/* Devices Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={7} />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-gray-400 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4">Device Model & ID</th>
                  <th className="px-6 py-4">Customer & Phone</th>
                  <th className="px-6 py-4">Retailer Store</th>
                  <th className="px-6 py-4">Lock Status</th>
                  <th className="px-6 py-4">Hardware Telemetry</th>
                  <th className="px-6 py-4">Last Check-In</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredDevices.length > 0 ? (
                  filteredDevices.map((dev) => (
                    <tr key={dev.deviceId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          onClick={() => onViewDeviceDetail(dev)}
                          className="font-bold text-white cursor-pointer hover:text-indigo-400 transition-colors"
                        >
                          {dev.model}
                        </div>
                        <div className="font-mono text-xs text-indigo-400 mt-0.5">{dev.deviceId}</div>
                        <div className="text-[11px] text-gray-500 font-mono">IMEI: {dev.imei || 'N/A'}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-white">{dev.customerName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{dev.customerPhone}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-300">
                        {dev.retailerName || 'Retailer Store'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`badge ${
                            dev.isRestricted ? 'badge-danger' : 'badge-success'
                          }`}
                        >
                          {dev.isRestricted ? 'RESTRICTED (LOCKED)' : 'ACTIVE (UNLOCKED)'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <div className="text-emerald-400 font-semibold flex items-center gap-1">
                          <BatteryCharging className="w-3.5 h-3.5" /> {dev.batteryLevel || 85}% Battery
                        </div>
                        <div className="text-gray-400 mt-0.5 flex items-center gap-1">
                          <Wifi className="w-3.5 h-3.5" /> {dev.connectionType || 'Wi-Fi'}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                        {new Date(dev.lastCheckIn || Date.now()).toLocaleTimeString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => onViewDeviceDetail(dev)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-gray-200 hover:bg-slate-700 text-xs font-semibold transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onInspectTelemetry(dev)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold transition-colors"
                        >
                          Telemetry
                        </button>
                        <button
                          onClick={() => onOpenCommand(dev)}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-semibold transition-colors"
                        >
                          Command
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No devices found matching search filters.
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

export default DevicesView;
