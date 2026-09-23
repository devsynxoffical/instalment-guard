import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { CreditCard, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export const NewPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { contracts, recordPayment, dispatchCommand } = useAuth();
  const { showToast } = useToast();

  const paramContractId = searchParams.get('contractId');
  const [selectedContractId, setSelectedContractId] = useState(paramContractId || (contracts[0]?.contractId || ''));
  const [amount, setAmount] = useState('5000');
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [autoUnlock, setAutoUnlock] = useState(true);
  const [loading, setLoading] = useState(false);

  const contract = contracts.find((c) => c.contractId === selectedContractId) || contracts[0];

  useEffect(() => {
    if (contract) {
      setAmount(contract.monthlyInstallment || '5000');
    }
  }, [selectedContractId, contract]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payNum = parseFloat(amount);
    if (!payNum || payNum <= 0) {
      showToast('Please enter a valid non-zero payment amount.', 'error');
      return;
    }

    if (!selectedContractId) {
      showToast('Please select a contract.', 'error');
      return;
    }

    setLoading(true);
    try {
      await recordPayment(selectedContractId, payNum, method, reference);
      showToast(`Payment of Rs. ${payNum.toLocaleString()} recorded successfully!`, 'success');

      if (contract?.status === 'RESTRICTED' && autoUnlock && contract.deviceId) {
        await dispatchCommand(contract.deviceId, 'REMOVE_RESTRICTION');
        showToast(`Restriction auto-cleared for device ${contract.deviceId}`, 'info');
      }

      navigate('/payments');
    } catch (err) {
      showToast(err.message || 'Failed to record payment.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[{ label: 'Payments', path: '/payments' }, { label: 'Record Payment' }]}
        title="Record Customer Payment"
        description="Process installment receipt, deduct contract balance, and auto-restore device access"
      />

      <form onSubmit={handleSubmit} className="teal-card p-8 max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer Contract *</label>
          <select
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
            className="input-field font-mono cursor-pointer"
          >
            {contracts.map((c) => (
              <option key={c.contractId} value={c.contractId}>
                {c.contractId} — {c.customerName} ({c.deviceModel})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Contract Brief Details */}
        {contract && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer Name:</span>
              <span className="font-bold text-slate-900">{contract.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone Number:</span>
              <span className="font-mono text-slate-700">{contract.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Remaining Balance:</span>
              <span className="font-bold text-emerald-700 font-mono">
                Rs. {(contract.remainingBalance || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Contract Status:</span>
              <span className={`badge ${contract.status === 'RESTRICTED' ? 'badge-danger' : 'badge-success'} text-[10px]`}>
                {contract.status}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (PKR) *</label>
          <div className="relative">
            <span className="text-slate-400 font-bold absolute left-3.5 top-1/2 -translate-y-1/2 text-xs">Rs.</span>
            <input
              type="number"
              required
              min="1"
              max={contract?.remainingBalance > 0 ? contract.remainingBalance : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field pl-10 font-mono text-base font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="input-field cursor-pointer"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="JazzCash">JazzCash</option>
              <option value="EasyPaisa">EasyPaisa</option>
              <option value="Cheque / Other">Cheque / Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Receipt Number</label>
            <input
              type="text"
              placeholder="e.g. TXN-998823"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="input-field font-mono"
            />
          </div>
        </div>

        {contract?.status === 'RESTRICTED' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <input
              type="checkbox"
              id="autoUnlock"
              checked={autoUnlock}
              onChange={(e) => setAutoUnlock(e.target.checked)}
              className="w-4 h-4 rounded text-teal-700 cursor-pointer"
            />
            <label htmlFor="autoUnlock" className="text-xs text-amber-900 cursor-pointer">
              Automatically send <strong>Remove Restriction</strong> unlock command to customer phone upon payment.
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate('/payments')}
            disabled={loading}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2.5"
          >
            {loading ? 'Recording Payment...' : 'Record Payment Receipt'}
          </button>
        </div>
      </form>
    </div>
  );
};
