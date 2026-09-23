import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { commandService } from '../services/commandService';
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
  ArrowLeft,
  History,
} from 'lucide-react';

export const DeviceDetailView = ({ device, onBack, onOpenCommand, onInspectTelemetry }) => {
  const [commandHistory, setCommandHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (device?.deviceId) {
      const unsub = commandService.subscribeCommandHistory(device.deviceId, (logs) => {
        setCommandHistory(logs);
        setLoadingHistory(false);
      });
      return () => unsub();
    }
  }, [device]);

  if (!device) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Devices
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => onInspectTelemetry(device)}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Cpu className="w-4 h-4 text-indigo-400" /> Full Hardware Telemetry
          </button>
          <button
            onClick={() => onOpenCommand(device)}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" /> Remote Command Center
          </button>
        </div>
      </div>

      {/* Main Device Header Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-700/60 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Smartphone className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{device.model}</h1>
                <span
                  className={`badge ${
                    device.isRestricted ? 'badge-danger' : 'badge-success'
                  } text-xs font-semibold`}
                >
                  {device.isRestricted ? 'RESTRICTED (LOCKED)' : 'ACTIVE (UNLOCKED)'}
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-1 font-mono">
                Device ID: {device.deviceId} • IMEI: {device.imei || 'N/A'} • Contract: {device.contractId}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                Customer: <strong className="text-white">{device.customerName}</strong> ({device.customerPhone})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 divide-x divide-slate-800 text-xs">
            <div className="space-y-1">
              <span className="text-gray-400">Battery Level</span>
              <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                <BatteryCharging className="w-4 h-4" /> {device.batteryLevel || 85}%
              </div>
            </div>
            <div className="pl-6 space-y-1">
              <span className="text-gray-400">Connection</span>
              <div className="flex items-center gap-2 font-bold text-sky-400 text-sm">
                <Wifi className="w-4 h-4" /> {device.connectionType || 'Wi-Fi'}
              </div>
            </div>
            <div className="pl-6 space-y-1">
              <span className="text-gray-400">Last Seen</span>
              <div className="flex items-center gap-2 text-gray-300 font-mono text-xs">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                {new Date(device.lastCheckIn || Date.now()).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hardware & OS Specs */}
        <div className="glass-card p-5 rounded-xl space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" /> Hardware & Android OS
          </h3>
          <div className="space-y-2 text-xs divide-y divide-slate-800/60">
            <div className="flex justify-between py-1.5">
              <span className="text-gray-400">Android Version</span>
              <span className="text-white font-medium">{device.androidVersion || '14.0'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-400">Security Patch</span>
              <span className="text-white font-medium">{device.securityPatch || '2026-08-01'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-400">Screen Resolution</span>
              <span className="text-white font-medium">{device.resolution || '1080 x 2400'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-400">RAM Memory</span>
              <span className="text-white font-medium">
                {device.availRamMb} MB free / {device.totalRamMb} MB
              </span>
            </div>
          </div>
        </div>

        {/* Storage & IP */}
        <div className="glass-card p-5 rounded-xl space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-sky-400" /> Disk Storage & IP
          </h3>
          <div className="space-y-2 text-xs divide-y divide-slate-800/60">
            <div className="flex justify-between py-1.5">
              <span className="text-gray-400">Total Storage</span>
              <span className="text-white font-medium">{device.totalStorageGb || '128.00'} GB</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-400">Available Storage</span>
              <span className="text-emerald-400 font-medium">{device.availStorageGb || '54.00'} GB</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-400">IP Address</span>
              <span className="text-white font-mono">{device.ipAddress || '192.168.1.1'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-400">Device Owner Mode</span>
              <span className="badge badge-success text-xs">ENFORCED</span>
            </div>
          </div>
        </div>

        {/* Location & Map Pin */}
        <div className="glass-card p-5 rounded-xl space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" /> GPS Location Pin
          </h3>
          <div className="text-xs space-y-2">
            <div className="p-3 bg-slate-900/60 rounded-lg font-mono text-gray-300 flex justify-between">
              <span>LAT: {device.latitude || 31.5204}</span>
              <span>LNG: {device.longitude || 74.3587}</span>
            </div>
            <a
              href={`https://maps.google.com/?q=${device.latitude || 31.5204},${device.longitude || 74.3587}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MapPin className="w-4 h-4" /> Open in Google Maps
            </a>
          </div>
        </div>
      </div>

      {/* Command Timeline History */}
      <div className="glass-card p-6 rounded-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" /> Command Audit Timeline
        </h3>

        <div className="space-y-3">
          {commandHistory.length > 0 ? (
            commandHistory.map((cmd) => (
              <div
                key={cmd.commandId || cmd.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{cmd.commandType}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{cmd.details}</div>
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
                  <div className="text-gray-500 font-mono text-xs">
                    {new Date(cmd.requestedAt || cmd.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-500 text-xs">
              No previous security commands logged for this device.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
