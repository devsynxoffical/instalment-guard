import React from 'react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import {
  Building2,
  Smartphone,
  ShieldAlert,
  Coins,
  FileText,
  CreditCard,
  PlusCircle,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { CardSkeleton, TableSkeleton } from '../components/SkeletonLoader';

export const DashboardView = ({ onInspectTelemetry, onOpenCommand, onEnrollDevice }) => {
  const { role, retailers, devices, contracts, payments, activeRetailer, loading } = useAuth();

  // Metrics Calculations
  const totalRetailersCount = retailers.length;
  const activeRetailersCount = retailers.filter((r) => r.status === 'ACTIVE').length;

  const totalDevicesCount = devices.length;
  const activeDevicesCount = devices.filter((d) => !d.isRestricted && d.deviceStatus !== 'COMPLETED').length;
  const restrictedDevicesCount = devices.filter((d) => d.isRestricted).length;

  const overdueContractsCount = contracts.filter((c) => c.status === 'RESTRICTED' || c.status === 'OVERDUE').length;
  const totalCollections = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalRemainingBalance = contracts.reduce((acc, c) => acc + (c.remainingBalance || 0), 0);

  const availableCredits = role === 'SUPER_ADMIN' ? 1000 : activeRetailer?.credits || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-400" /> Platform Overview & Control Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time device lock status, hardware telemetry, and installment ledger analytics
          </p>
        </div>

        <button
          onClick={onEnrollDevice}
          className="btn-primary flex items-center gap-2 py-2.5 px-5 shadow-lg shadow-indigo-600/30"
        >
          <PlusCircle className="w-5 h-5" /> Enroll New Customer Device
        </button>
      </div>

      {/* Analytics Stat Cards */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {role === 'SUPER_ADMIN' && (
            <StatCard
              title="Active Retailers"
              value={`${activeRetailersCount} / ${totalRetailersCount}`}
              subText="Partner Mobile Shops"
              icon={Building2}
              trend="+2 this month"
              color="indigo"
            />
          )}

          <StatCard
            title="Total Managed Devices"
            value={totalDevicesCount}
            subText={`${activeDevicesCount} Active • ${restrictedDevicesCount} Restricted`}
            icon={Smartphone}
            color="sky"
          />

          <StatCard
            title="Restricted (Locked) Devices"
            value={restrictedDevicesCount}
            subText={`${overdueContractsCount} Overdue Contracts`}
            icon={ShieldAlert}
            color="rose"
          />

          <StatCard
            title="Available License Credits"
            value={role === 'SUPER_ADMIN' ? '∞ Unlimited' : availableCredits}
            subText="1 Credit per Device Enrollment"
            icon={Coins}
            color="amber"
          />

          <StatCard
            title="Total Installment Collections"
            value={`Rs. ${totalCollections.toLocaleString()}`}
            subText={`Outstanding: Rs. ${totalRemainingBalance.toLocaleString()}`}
            icon={CreditCard}
            color="emerald"
          />
        </div>
      )}

      {/* Live Device Status Table */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-400" /> Live Enrolled Devices Feed
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Click any device to inspect real-time RAM, storage, battery, or send lock commands
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : (
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-gray-400 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-3.5">Device & Model</th>
                  <th className="px-6 py-3.5">Customer & Phone</th>
                  <th className="px-6 py-3.5">Lock Status</th>
                  <th className="px-6 py-3.5">Battery & Net</th>
                  <th className="px-6 py-3.5">Last Check-In</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {devices.length > 0 ? (
                  devices.slice(0, 5).map((dev) => (
                    <tr key={dev.deviceId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{dev.model}</div>
                        <div className="font-mono text-xs text-indigo-400 mt-0.5">{dev.deviceId}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-white">{dev.customerName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{dev.customerPhone}</div>
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
                        <div className="text-emerald-400 font-medium">{dev.batteryLevel || 85}% Battery</div>
                        <div className="text-gray-400 mt-0.5">{dev.connectionType || 'Wi-Fi'}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                        {new Date(dev.lastCheckIn || Date.now()).toLocaleTimeString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => onInspectTelemetry(dev)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold transition-colors"
                        >
                          Telemetry
                        </button>
                        <button
                          onClick={() => onOpenCommand(dev)}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-semibold transition-colors"
                        >
                          Command
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-sm">
                      No devices enrolled yet. Click "Enroll New Customer Device" to start.
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

export default DashboardView;
