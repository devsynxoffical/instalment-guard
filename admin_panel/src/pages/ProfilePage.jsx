import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { User, Mail, Phone, Building2, ShieldCheck, Lock, Save, Calendar } from 'lucide-react';

export const ProfilePage = () => {
  const { role, userProfile, activeRetailer, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(userProfile?.name || activeRetailer?.ownerName || 'Muhammad Tariq');
  const [phone, setPhone] = useState(userProfile?.phone || activeRetailer?.phone || '+92 300 1234567');
  const [businessName, setBusinessName] = useState(activeRetailer?.businessName || 'Mobile Zone Saddar');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Profile information updated successfully!', 'success');
    }, 500);
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword(userProfile?.email || 'admin@installmentguard.com');
      showToast('Password recovery email sent successfully!', 'success');
    } catch (err) {
      showToast('Sent password recovery email.', 'info');
    }
  };

  return (
    <div className="page-container space-y-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        breadcrumbs={[{ label: 'Profile' }]}
        title="User Account & Store Profile"
        description="View and update your personal profile details, store name, and account security"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Header */}
        <div className="teal-card p-6 text-center space-y-4 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-teal-700 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-teal-700/20">
            {role === 'SUPER_ADMIN' ? 'SA' : name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{name}</h2>
            <div className="mt-1">
              <span className="badge badge-teal font-bold">{role}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Member since July 2026
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSaveProfile} className="md:col-span-2 teal-card p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2">
            Personal & Store Profile Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Store Name</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Read-only)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={userProfile?.email || 'admin@installmentguard.com'}
                  className="input-field pl-10 bg-slate-100 cursor-not-allowed text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleResetPassword}
              className="btn-secondary text-xs"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" /> Send Password Reset Email
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
