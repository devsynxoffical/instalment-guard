import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Search, Calendar, User, FileText, CheckCircle } from 'lucide-react';
import { TableSkeleton } from '../components/SkeletonLoader';

export const PaymentsView = () => {
  const { payments, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const filteredPayments = payments.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (p.contractId && p.contractId.toLowerCase().includes(term)) ||
      (p.customerName && p.customerName.toLowerCase().includes(term)) ||
      (p.reference && p.reference.toLowerCase().includes(term)) ||
      (p.recordedBy && p.recordedBy.toLowerCase().includes(term));

    const matchesMethod = methodFilter === 'ALL' || p.method === methodFilter;

    return matchesSearch && matchesMethod;
  });

  const totalCollections = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-400" /> Customer Payment Ledger
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time collection receipts and installment transaction history
          </p>
        </div>

        <div className="glass-card px-4 py-2.5 rounded-xl flex items-center gap-3 border border-emerald-500/30">
          <span className="text-xs text-gray-400">Total System Collections:</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">
            Rs. {totalCollections.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by contract ID, customer, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="input-field cursor-pointer"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="JazzCash">JazzCash</option>
            <option value="EasyPaisa">EasyPaisa</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={6} />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-gray-400 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4">Receipt ID & Date</th>
                  <th className="px-6 py-4">Contract ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount Paid</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((p) => (
                    <tr key={p.paymentId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-indigo-400 font-semibold">{p.paymentId}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          {new Date(p.paymentDate || p.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-emerald-400">
                        {p.contractId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {p.customerName || 'Customer'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-emerald-400 font-mono">
                          Rs. {(p.amount || 0).toLocaleString()}
                        </div>
                        {p.reference && (
                          <div className="text-xs text-gray-500 font-mono mt-0.5">Ref: {p.reference}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge badge-info">{p.method || 'Cash'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                        {p.recordedBy || 'Admin'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No customer payment receipts found matching search filters.
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
