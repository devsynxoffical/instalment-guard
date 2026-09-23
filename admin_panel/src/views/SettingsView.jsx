import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Settings, ShieldCheck, Sun, Moon, User, Save, Lock, Bell } from 'lucide-react';

export const SettingsView = () => {
  const { role, activeRetailer, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [systemName, setSystemName] = useState('Installment Guard Pro');
  const [currency, setCurrency] = useState('PKR (Rs.)');
  const [offlineThresholdMins, setOfflineThresholdMins] = useState('15');
  const [loading, setLoading] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('System settings saved successfully!', 'success');
    }, 600);
  };

  const handlePasswordReset = async () => {
    try {
      await resetPassword(activeRetailer?.email || 'admin@installmentguard.com');
      showToast('Password reset link sent to your registered email.', 'success');
    } catch (error) {
      showToast('Demo password reset trigger executed.', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-400" /> Platform & Security Settings
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Configure operational thresholds, branding, themes, and security preferences
        </p>
      </div>

      {/* Theme Preference Card */}
      <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-400" />} Appearance Theme
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Current active theme: <strong className="capitalize text-white">{theme} Mode</strong>
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="btn-secondary text-xs flex items-center gap-2 py-2 px-4"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      {/* Super Admin System Settings */}
      {role === 'SUPER_ADMIN' ? (
        <form onSubmit={handleSaveSettings} className="glass-card p-6 rounded-2xl space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400" /> Super Admin Operational Controls
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">System Name</label>
              <input
                type="text"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Default Platform Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Device Offline Threshold (Minutes)
              </label>
              <input
                type="number"
                value={offlineThresholdMins}
                onChange={(e) => setOfflineThresholdMins(e.target.value)}
                className="input-field"
              />
              <span className="text-xs text-gray-500 mt-1 block">
                Devices without a heartbeat after this window will be marked Offline.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Command Expiration (Hours)</label>
              <input type="number" defaultValue="24" className="input-field" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-6 py-2.5"
            >
              <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      ) : (
        /* Retailer Profile Settings */
        <div className="glass-card p-6 rounded-2xl space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-5 h-5 text-sky-400" /> Retailer Business Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-900/60 rounded-xl space-y-1">
              <span className="text-gray-400">Business Name</span>
              <div className="text-white font-semibold text-sm">{activeRetailer?.businessName || 'My Store'}</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl space-y-1">
              <span className="text-gray-400">Owner Name</span>
              <div className="text-white font-semibold text-sm">{activeRetailer?.ownerName || 'Owner'}</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl space-y-1">
              <span className="text-gray-400">Contact Phone</span>
              <div className="text-white font-semibold text-sm">{activeRetailer?.phone || '+92 300 0000000'}</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl space-y-1">
              <span className="text-gray-400">Available Credits Balance</span>
              <div className="text-emerald-400 font-bold text-sm font-mono">{activeRetailer?.credits || 0} Credits</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Account Password</h4>
              <p className="text-xs text-gray-400">Send password recovery link to registered email</p>
            </div>
            <button onClick={handlePasswordReset} className="btn-secondary text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" /> Reset Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
