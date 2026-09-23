import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Coins, Building2, FileText, CheckCircle2, History } from 'lucide-react';

export const AllocateCreditsPage = () => {
  const { retailerId } = useParams();
  const navigate = useNavigate();
  const { retailers, allocateCredits } = useAuth();
  const { showToast } = useToast();

  const retailer = retailers.find((r) => r.id === retailerId) || retailers[0];
  const [addCredits, setAddCredits] = useState('10');
  const [reason, setReason] = useState('Bulk License Purchase');
  const [loading, setLoading] = useState(false);

  if (!retailer) {
    return (
      <div className="page-container py-12 text-center text-slate-500">
        Retailer not found.{' '}
        <button onClick={() => navigate('/retailers')} className="text-teal-700 font-bold underline">
          Back to Directory
        </button>
      </div>
    );
  }

  const currentBalance = retailer.credits || 0;
  const numAdd = parseInt(addCredits, 10) || 0;
  const newBalance = currentBalance + numAdd;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!numAdd || numAdd <= 0) {
      showToast('Please enter a valid number of credits to add.', 'error');
      return;
    }

    setLoading(true);
    try {
      await allocateCredits(retailer.id, numAdd, reason);
      showToast(`Successfully allocated +${numAdd} credits to ${retailer.businessName}!`, 'success');
      navigate(`/retailers/${retailer.id}`);
    } catch (err) {
      showToast(err.message || 'Failed to allocate credits.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[
          { label: 'Retailers', path: '/retailers' },
          { label: retailer.businessName, path: `/retailers/${retailer.id}` },
          { label: 'Allocate Credits' },
        ]}
        title="Credit Allocation & License Management"
        description={`Allocate device enrollment licenses to ${retailer.businessName}`}
      />

      <form onSubmit={handleSubmit} className="teal-card p-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="p-3 bg-amber-500 text-white rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{retailer.businessName}</div>
            <div className="text-xs text-slate-600">Owner: {retailer.ownerName} • City: {retailer.city}</div>
          </div>
        </div>

        {/* Credit Math Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Current Balance</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono">{currentBalance}</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-xs text-amber-700 font-medium block">Credits To Add</span>
            <span className="text-xl font-extrabold text-amber-700 font-mono">+{numAdd}</span>
          </div>

          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
            <span className="text-xs text-teal-700 font-medium block">New Balance</span>
            <span className="text-xl font-extrabold text-teal-800 font-mono">{newBalance}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Number of License Credits *</label>
          <input
            type="number"
            min="1"
            required
            value={addCredits}
            onChange={(e) => setAddCredits(e.target.value)}
            className="input-field font-mono text-base font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Transaction Notes</label>
          <input
            type="text"
            placeholder="e.g. Bulk License Purchase #1042"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate(`/retailers/${retailer.id}`)}
            disabled={loading}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary bg-amber-600 hover:bg-amber-700 px-6 py-2.5"
          >
            {loading ? 'Allocating...' : 'Allocate Credits Now'}
          </button>
        </div>
      </form>
    </div>
  );
};
