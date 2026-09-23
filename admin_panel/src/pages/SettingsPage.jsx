import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Settings, ShieldCheck, Save, Lock, Bell } from 'lucide-react';

export const SettingsPage = () => {
  const { role, activeRetailer, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [systemName, setSystemName] = useState('Installment Guard Enterprise');
  const [currency, setCurrency] = useState('PKR (Rs.)');
  const [offlineThresholdMins, setOfflineThresholdMins] = useState('15');
  const [commandExpiration, setCommandExpiration] = useState('24');
  const [loading, setLoading] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('System configuration saved successfully!', 'success');
    }, 500);
  };

  return (
    <div className="page-container space-y-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        breadcrumbs={[{ label: 'Settings' }]}
        title="Platform Configuration & System Settings"
        description="Configure operational thresholds, device health timeouts, currency, and security parameters"
      />

      <form onSubmit={handleSaveSettings} className="teal-card p-8 space-y-6">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
          <ShieldCheck className="w-5 h-5 text-teal-700" /> Operational & Device Protection Settings
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">System Name</label>
            <input
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Default Currency</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Device Heartbeat Offline Threshold (Minutes)
            </label>
            <input
              type="number"
              value={offlineThresholdMins}
              onChange={(e) => setOfflineThresholdMins(e.target.value)}
              className="input-field font-mono"
            />
            <span className="text-xs text-slate-400 mt-1 block">
              Devices missing heartbeats past this duration are marked Offline.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Command Expiration (Hours)</label>
            <input
              type="number"
              value={commandExpiration}
              onChange={(e) => setCommandExpiration(e.target.value)}
              className="input-field font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2.5"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
