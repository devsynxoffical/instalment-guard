import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Building2, User, Phone, MapPin, KeyRound, AlertCircle } from 'lucide-react';

export const LoginView = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('admin@installmentguard.com');
  const [password, setPassword] = useState('Admin@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sign Up Extra Fields
  const [signUpData, setSignUpData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    city: 'Karachi',
    address: '',
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      showToast(`Welcome back, ${result.user?.name || result.user?.email}!`, 'success');
      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      const msg = error.message || 'Invalid email or password. Please verify your credentials.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password || !signUpData.businessName || !signUpData.ownerName) {
      setErrorMessage('Please fill in all required fields to register.');
      showToast('Please fill in all required fields to register.', 'error');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        businessName: signUpData.businessName,
        ownerName: signUpData.ownerName,
        email,
        password,
        phone: signUpData.phone || '+92 300 0000000',
        city: signUpData.city,
        address: signUpData.address || '',
      });

      // Auto login post registration
      await login(email, password);
      showToast(`Account registered successfully for ${signUpData.businessName}!`, 'success');
      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      const msg = error.message || 'Registration failed.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectCredentials = (userType) => {
    setErrorMessage('');
    if (userType === 'ADMIN') {
      setEmail('admin@installmentguard.com');
      setPassword('Admin@12345');
    } else if (userType === 'RETAILER') {
      setEmail('retailer@mobilezone.com');
      setPassword('Retailer@12345');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-indigo-600 to-sky-500 text-white rounded-2xl shadow-lg shadow-indigo-600/40 mb-2">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">INSTALLMENT GUARD</h1>
          <p className="text-xs text-slate-400">Enterprise FinTech Asset Protection & Lock System</p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl text-xs font-semibold border border-slate-700/50">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMessage(''); }}
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              !isSignUp ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Portal Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMessage(''); }}
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              isSignUp ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register Store
          </button>
        </div>

        {/* Verified Quick Login Credentials Box */}
        {!isSignUp && (
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1"><KeyRound className="w-3.5 h-3.5 text-indigo-400" /> Database Quick Credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selectCredentials('ADMIN')}
                className={`px-3 py-2 rounded-lg text-left border transition-all ${
                  email === 'admin@installmentguard.com'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/70'
                }`}
              >
                <div className="text-[11px] font-bold text-white flex items-center gap-1">👑 Super Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin@installmentguard.com</div>
              </button>
              <button
                type="button"
                onClick={() => selectCredentials('RETAILER')}
                className={`px-3 py-2 rounded-lg text-left border transition-all ${
                  email === 'retailer@mobilezone.com'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/70'
                }`}
              >
                <div className="text-[11px] font-bold text-white flex items-center gap-1">🏪 Retailer Store</div>
                <div className="text-[10px] text-slate-400 truncate">retailer@mobilezone.com</div>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form: Sign In */}
        {!isSignUp ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Login Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@installmentguard.com"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                'Verifying Credentials...'
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Secure Sign In
                </>
              )}
            </button>
          </form>
        ) : (
          /* Form: Sign Up Partner */
          <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store / Business Name *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Galaxy Mobile Center"
                  value={signUpData.businessName}
                  onChange={(e) => setSignUpData({ ...signUpData, businessName: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Owner Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Owner Name"
                    value={signUpData.ownerName}
                    onChange={(e) => setSignUpData({ ...signUpData, ownerName: e.target.value })}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
                <select
                  value={signUpData.city}
                  onChange={(e) => setSignUpData({ ...signUpData, city: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Multan">Multan</option>
                  <option value="Peshawar">Peshawar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={signUpData.phone}
                  onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Login Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="store@example.com"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Create Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create strong password"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                'Registering Store Account...'
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Register & Activate Store
                </>
              )}
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div className="pt-3 border-t border-slate-700/60 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Encrypted Bcrypt / JWT Database Authentication</span>
        </div>
      </div>
    </div>
  );
};

