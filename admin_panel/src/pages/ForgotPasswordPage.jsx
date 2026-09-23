import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, Mail, ArrowLeft, Send } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      showToast(`Password reset link sent to ${email}`, 'success');
    } catch (err) {
      setSent(true);
      showToast('Sent password reset link.', 'info');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-teal-700 text-white rounded-2xl shadow-lg shadow-teal-700/25 mb-1">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">INSTALLMENT GUARD</h1>
          <h2 className="text-sm font-semibold text-slate-700">Forgot Password?</h2>
          <p className="text-xs text-slate-500">
            Enter your email and we'll send you instructions to reset your password.
          </p>
        </div>

        {sent ? (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-center space-y-3">
            <div className="text-xs text-teal-800 font-medium leading-relaxed">
              Check your inbox at <strong>{email}</strong> for password recovery link.
            </div>
            <Link
              to="/login"
              className="btn-primary w-full py-2.5 text-xs text-center justify-center inline-flex"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="retailer@store.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                'Sending Link...'
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Reset Link
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          <Link to="/login" className="text-teal-700 font-semibold inline-flex items-center gap-1.5 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
