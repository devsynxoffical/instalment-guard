import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Search,
  Lock,
  Unlock,
  Coins,
  Smartphone,
  RefreshCw,
  Clock,
  UserCheck,
  Building2,
  FileText,
} from 'lucide-react';

export const AuditLogsView = () => {
  const { auditLogs, role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.performer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'ALL' || log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'RESTRICT_DEVICE':
        return (
          <span className="badge badge-danger flex items-center gap-1">
            <Lock className="w-3 h-3" /> RESTRICTED
          </span>
        );
      case 'REMOVE_RESTRICTION':
        return (
          <span className="badge badge-success flex items-center gap-1">
            <Unlock className="w-3 h-3" /> RESTORED
          </span>
        );
      case 'CREDITS_ALLOCATED':
        return (
          <span className="badge badge-purple flex items-center gap-1">
            <Coins className="w-3 h-3" /> CREDITS ADDED
          </span>
        );
      case 'DEVICE_ENROLLED':
        return (
          <span className="badge badge-info flex items-center gap-1">
            <Smartphone className="w-3 h-3" /> ENROLLED
          </span>
        );
      case 'PAYMENT_RECORDED':
        return (
          <span className="badge badge-success flex items-center gap-1">
            <FileText className="w-3 h-3" /> PAYMENT
          </span>
        );
      case 'SYNC_DEVICE':
        return (
          <span className="badge badge-warning flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> TELEMETRY SYNC
          </span>
        );
      default:
        return <span className="badge badge-secondary">{action}</span>;
    }
  };

  const getRoleBadge = (logRole) => {
    if (logRole === 'SUPER_ADMIN') {
      return <span className="badge badge-purple text-xs font-semibold">SUPER ADMIN</span>;
    }
    return <span className="badge badge-info text-xs font-semibold">RETAILER</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-400" /> System Audit & Command History
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Immutable security trail of remote lock commands, credit allocations, and device enrollments
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by target, performer, details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="input-field cursor-pointer"
          >
            <option value="ALL">All Log Categories</option>
            <option value="RESTRICT_DEVICE">Device Restrictions (Locks)</option>
            <option value="REMOVE_RESTRICTION">Device Restorations (Unlocks)</option>
            <option value="CREDITS_ALLOCATED">Credit Allocations</option>
            <option value="DEVICE_ENROLLED">Device Enrollments</option>
            <option value="PAYMENT_RECORDED">Installment Payments</option>
            <option value="SYNC_DEVICE">Telemetry Syncs</option>
          </select>
        </div>
      </div>

      {/* Audit Trail List / Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-gray-400 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4">Log ID & Time</th>
                <th className="px-6 py-4">Performer</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target Entity</th>
                <th className="px-6 py-4">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-xs text-indigo-400 font-semibold">{log.id}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-white flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        {log.performer}
                      </div>
                      <div className="mt-1">{getRoleBadge(log.role)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white font-mono text-xs">
                      {log.target}
                    </td>
                    <td className="px-6 py-4 text-gray-300 max-w-md">
                      <span className="text-xs">{log.details}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No matching security audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsView;
