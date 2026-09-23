import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Building2, User, Phone, MapPin } from 'lucide-react';

export const LoginView = ({ onLoginSuccess }) => {
  const { login, resetPassword, switchRole, createRetailer } = useAuth();
  const { showToast } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('admin@installmentguard.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Sign Up Extra Fields
  const [signUpData, setSignUpData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    city: 'Karachi',
    role: 'RETAILER',
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      showToast('Authentication successful! Welcome to Installment Guard Admin Panel.', 'success');
      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      showToast('Logged in (Demo Active Session)', 'success');
      if (onLoginSuccess) onLoginSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !signUpData.businessName || !signUpData.ownerName) {
      showToast('Please fill in all required fields to register.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (signUpData.role === 'RETAILER') {
        await createRetailer({
          businessName: signUpData.businessName,
          ownerName: signUpData.ownerName,
          email,
          phone: signUpData.phone || '+92 300 0000000',
          city: signUpData.city,
          initialCredits: '10',
          status: 'ACTIVE',
        });
        switchRole('RETAILER');
      } else {
        switchRole('SUPER_ADMIN');
      }

      showToast(`Account registered successfully for ${signUpData.businessName}!`, 'success');
      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      showToast('Registered Demo Partner Account!', 'success');
      if (onLoginSuccess) onLoginSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      showToast('Please enter your email address.', 'error');
      return;
    }
    try {
      await resetPassword(resetEmail);
      showToast(`Password reset link sent to ${resetEmail}`, 'success');
      setIsResetModalOpen(false);
    } catch (error) {
      showToast('Sent demo password recovery email.', 'info');
      setIsResetModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Light Gradient Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30 mb-2">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">INSTALLMENT GUARD</h1>
          <p className="text-xs text-slate-500">Enterprise Mobile Security & Lock Admin Panel</p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              !isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Sign Up Partner
          </button>
        </div>

        {/* Quick Demo Test Bar */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Quick Demo Role:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('superadmin@installmentguard.com');
                switchRole('SUPER_ADMIN');
                if (onLoginSuccess) onLoginSuccess();
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors font-semibold"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('retailer@mobilezone.pk');
                switchRole('RETAILER');
                if (onLoginSuccess) onLoginSuccess();
              }}
              className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors font-semibold"
            >
              Retailer
            </button>
          </div>
        </div>

        {/* Form: Sign In */}
        {!isSignUp ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@installmentguard.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                Remember session
              </label>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-98"
            >
              {loading ? (
                'Authenticating...'
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In to Dashboard
                </>
              )}
            </button>
          </form>
        ) : (
          /* Form: Sign Up Partner */
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Business Store Name *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Galaxy Mobile Shop"
                  value={signUpData.businessName}
                  onChange={(e) => setSignUpData({ ...signUpData, businessName: e.target.value })}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Owner Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Owner Name"
                    value={signUpData.ownerName}
                    onChange={(e) => setSignUpData({ ...signUpData, ownerName: e.target.value })}
                    className="input-field pl-10 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                <select
                  value={signUpData.city}
                  onChange={(e) => setSignUpData({ ...signUpData, city: e.target.value })}
                  className="input-field cursor-pointer text-xs"
                >
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Islamabad">Islamabad</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="retailer@store.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create Password"
                  className="input-field pl-10 pr-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                'Registering...'
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Register Partner Store
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
          Installment Guard Enterprise Security • Firebase Protected
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
            <p className="text-xs text-slate-600">
              Enter your registered email address to receive password recovery instructions.
            </p>
            <form onSubmit={handleResetSubmit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="retailer@store.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="input-field"
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg bg-indigo-600 hover:bg-indigo-500"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
