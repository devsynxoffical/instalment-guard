import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CreditCard, DollarSign, FileText, CheckCircle2, X } from 'lucide-react';

export const RecordPaymentModal = ({ contract, onClose }) => {
  const { recordPayment, dispatchCommand } = useAuth();
  const { showToast } = useToast();

  const [amount, setAmount] = useState(contract?.monthlyInstallment || '5000');
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [autoUnlock, setAutoUnlock] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!contract) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payNum = parseFloat(amount);
    if (!payNum || payNum <= 0) {
      showToast('Please enter a valid non-zero payment amount.', 'error');
      return;
    }

    setLoading(true);
    try {
      await recordPayment(contract.contractId, payNum, method, reference);
      showToast(`Payment of Rs. ${payNum.toLocaleString()} recorded successfully!`, 'success');

      // Auto-unlock if contract was restricted and autoUnlock is checked
      if (contract.status === 'RESTRICTED' && autoUnlock && contract.deviceId) {
        await dispatchCommand(contract.deviceId, 'REMOVE_RESTRICTION');
        showToast(`Restriction auto-cleared for device ${contract.deviceId}`, 'info');
      }

      onClose();
    } catch (error) {
      showToast(error.message || 'Failed to record payment.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white max-w-md w-full rounded-2xl p-6 border border-slate-200 shadow-2xl relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Record Customer Payment</h2>
            <p className="text-xs text-slate-500 font-mono">Contract: {contract.contractId}</p>
          </div>
        </div>

        {/* Contract Brief Summary */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 mb-4 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Customer:</span>
            <span className="font-semibold text-slate-900">{contract.customerName}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Remaining Balance:</span>
            <span className="font-bold text-emerald-700">Rs. {(contract.remainingBalance || 0).toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (PKR) *</label>
            <div className="relative">
              <span className="text-slate-400 font-semibold absolute left-3.5 top-1/2 -translate-y-1/2 text-xs">Rs.</span>
              <input
                type="number"
                required
                min="1"
                max={contract?.remainingBalance > 0 ? contract.remainingBalance : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field pl-10 font-mono"
              />
            </div>
          </div>

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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Reference / Receipt #</label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. TXN-998823"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {contract.status === 'RESTRICTED' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <input
                type="checkbox"
                id="autoUnlock"
                checked={autoUnlock}
                onChange={(e) => setAutoUnlock(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 cursor-pointer"
              />
              <label htmlFor="autoUnlock" className="text-xs text-amber-900 cursor-pointer">
                Automatically send <strong>Remove Restriction</strong> command to unlock device upon payment.
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-5 py-2"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
