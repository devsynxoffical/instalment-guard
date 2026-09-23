import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Search, CreditCard, Calendar, User, CheckCircle2, ShieldAlert } from 'lucide-react';
import { TableSkeleton } from '../components/SkeletonLoader';
import { RecordPaymentModal } from '../components/RecordPaymentModal';

export const ContractsView = () => {
  const { contracts, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRecordContract, setSelectedRecordContract] = useState(null);

  const filteredContracts = contracts.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.contractId.toLowerCase().includes(term) ||
      (c.customerName && c.customerName.toLowerCase().includes(term)) ||
      (c.customerPhone && c.customerPhone.toLowerCase().includes(term)) ||
      (c.customerCnic && c.customerCnic.toLowerCase().includes(term)) ||
      (c.deviceModel && c.deviceModel.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-400" /> Installment Ledger & Contracts
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Track customer installment plans, remaining balances, due dates, and record payments
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by contract ID, customer, CNIC, device..."
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
            <option value="ALL">All Contract Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="RESTRICTED">RESTRICTED (OVERDUE)</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={7} />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-gray-400 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4">Contract ID & Model</th>
                  <th className="px-6 py-4">Customer Info</th>
                  <th className="px-6 py-4">Monthly Installment</th>
                  <th className="px-6 py-4">Remaining Balance</th>
                  <th className="px-6 py-4">Next Due Date</th>
                  <th className="px-6 py-4">Contract Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredContracts.length > 0 ? (
                  filteredContracts.map((c) => (
                    <tr key={c.contractId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-indigo-400 font-semibold">{c.contractId}</div>
                        <div className="font-medium text-white text-xs mt-0.5">{c.deviceModel}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{c.customerName}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">CNIC: {c.customerCnic}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{c.customerPhone}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-white font-mono">
                          Rs. {(c.monthlyInstallment || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Paid: {c.paidMonths || 0} / {c.totalMonths || 8} months
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-emerald-400 font-mono text-base">
                          Rs. {(c.remainingBalance || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Total Price: Rs. {(c.totalPrice || 0).toLocaleString()}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {c.nextDueDate || '2026-10-10'}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`badge ${
                            c.status === 'COMPLETED'
                              ? 'badge-success'
                              : c.status === 'RESTRICTED'
                              ? 'badge-danger'
                              : 'badge-info'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {c.remainingBalance > 0 ? (
                          <button
                            onClick={() => setSelectedRecordContract(c)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 inline-flex items-center gap-1.5 transition-all"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Record Payment
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Fully Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No installment contracts found matching search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {selectedRecordContract && (
        <RecordPaymentModal
          contract={selectedRecordContract}
          onClose={() => setSelectedRecordContract(null)}
        />
      )}
    </div>
  );
};

export default ContractsView;
