import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { ShieldCheck, Search, Lock, Unlock, Coins, Smartphone, RefreshCw, Clock, UserCheck, FileText } from 'lucide-react';
import { TableSkeleton } from '../components/SkeletonLoader';

export const AuditLogsPage = () => {
  const { auditLogs, loading } = useAuth();
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
        return <span className="badge badge-danger">LOCK DEVICE</span>;
      case 'REMOVE_RESTRICTION':
        return <span className="badge badge-success">UNLOCK DEVICE</span>;
      case 'CREDITS_ALLOCATED':
        return <span className="badge badge-teal">CREDITS ADDED</span>;
      case 'DEVICE_ENROLLED':
        return <span className="badge badge-info">ENROLLED</span>;
      case 'RECORD_PAYMENT':
        return <span className="badge badge-success">PAYMENT</span>;
      default:
        return <span className="badge badge-secondary">{action}</span>;
    }
  };

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[{ label: 'Audit Logs' }]}
        title="Security Audit Logs & Command Trail"
        description="Immutable action log tracking remote device locks, credit allocations, and system changes"
      />

      {/* Filter Bar */}
      <div className="teal-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search by target, performer, details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="input-field cursor-pointer"
          >
            <option value="ALL">All Action Categories</option>
            <option value="RESTRICT_DEVICE">Device Restrictions (Locks)</option>
            <option value="REMOVE_RESTRICTION">Device Restorations (Unlocks)</option>
            <option value="CREDITS_ALLOCATED">Credit Allocations</option>
            <option value="DEVICE_ENROLLED">Device Enrollments</option>
            <option value="RECORD_PAYMENT">Installment Payments</option>
          </select>
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="teal-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={5} />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Log ID & Time</th>
                  <th className="px-6 py-4">Performer & Role</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target Entity</th>
                  <th className="px-6 py-4">Activity Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-teal-700 font-bold">{log.id}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-teal-700" />
                          {log.performer}
                        </div>
                        <div className="mt-1">
                          <span className="badge badge-teal text-[10px]">{log.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-900 font-bold">
                        {log.target}
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-md text-xs">
                        {log.details}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                      No security audit logs found matching search filters.
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
