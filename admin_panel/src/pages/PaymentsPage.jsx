import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { CreditCard, Search, Calendar, User, PlusCircle } from 'lucide-react';
import { TableSkeleton } from '../components/SkeletonLoader';

export const PaymentsPage = () => {
  const navigate = useNavigate();
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
    <div className="page-container space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[{ label: 'Payments' }]}
        title="Customer Payments Ledger"
        description="Collection receipts history, payment methods breakdown, and installment transactions"
        action={
          <button
            onClick={() => navigate('/payments/new')}
            className="btn-primary"
          >
            <PlusCircle className="w-5 h-5" /> Record Payment
          </button>
        }
      />

      {/* Metric Summary Card */}
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Total System Collections:
        </span>
        <span className="text-xl font-extrabold text-emerald-700 font-mono">
          Rs. {totalCollections.toLocaleString()}
        </span>
      </div>

      {/* Filter Bar */}
      <div className="teal-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search by contract ID, customer, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto pl-0 md:pl-6 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0">
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
      <div className="teal-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={6} />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Receipt ID & Date</th>
                  <th className="px-6 py-4">Contract ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount Paid</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((p) => (
                    <tr key={p.paymentId} className="hover:bg-teal-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-teal-700 font-bold">{p.paymentId}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(p.paymentDate || p.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-teal-800">
                        {p.contractId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {p.customerName || 'Customer'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-extrabold text-emerald-700 font-mono">
                          Rs. {(p.amount || 0).toLocaleString()}
                        </div>
                        {p.reference && (
                          <div className="text-xs text-slate-400 font-mono mt-0.5">Ref: {p.reference}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          ✅ PAID
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge badge-info font-bold">{p.method || 'Cash'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">
                        {p.recordedBy || 'Admin'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      No customer payment receipts found.
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
