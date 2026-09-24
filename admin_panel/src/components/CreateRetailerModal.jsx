import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Building2, User, Mail, Phone, MapPin, Coins, X, ShieldCheck, Lock, Sparkles, Copy, CheckCircle2 } from 'lucide-react';
import { PAKISTAN_CITIES } from '../constants/cities';

export const CreateRetailerModal = ({ isOpen, onClose }) => {
  const { createRetailer } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    password: 'Store@' + Math.floor(1000 + Math.random() * 9000),
    phone: '',
    address: '',
    city: 'Karachi',
    initialCredits: '15',
    status: 'ACTIVE',
  });

  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Ret@';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `🛡️ INSTALLMENT GUARD RETAILER LOGIN CREDENTIALS:\n• Store: ${createdCredentials.businessName}\n• Portal URL: http://localhost:5173\n• Email / Login: ${createdCredentials.email}\n• Password: ${createdCredentials.password}\n• Initial Credits: ${createdCredentials.credits}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Credentials copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.businessName || !formData.ownerName || !formData.email || !formData.phone) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      await createRetailer(formData);
      setCreatedCredentials({
        businessName: formData.businessName,
        email: formData.email,
        password: formData.password || 'Retailer@12345',
        credits: formData.initialCredits,
      });
      showToast(`Retailer account created for "${formData.businessName}"!`, 'success');
    } catch (error) {
      showToast(error.message || 'Failed to create retailer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCreatedCredentials(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white max-w-lg w-full rounded-2xl p-6 border border-slate-200 shadow-2xl relative">
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!createdCredentials ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create New Retailer Store</h2>
                <p className="text-xs text-slate-500">Generates database login credentials & allocates initial license credits</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Business Store Name *</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mobile Zone Saddar"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tariq Mahmood"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Login Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="retailer@store.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Login Password *</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5"
                    >
                      <Sparkles className="w-3 h-3" /> Auto Generate
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Strong Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-field pl-10 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="+92 300 0000000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field pl-10 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-field cursor-pointer font-semibold text-xs"
                  >
                    {PAKISTAN_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Credits</label>
                  <div className="relative">
                    <Coins className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      min="0"
                      value={formData.initialCredits}
                      onChange={(e) => setFormData({ ...formData, initialCredits: e.target.value })}
                      className="input-field pl-10 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shop Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <textarea
                    rows="2"
                    placeholder="Shop number, plaza name, market area..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field pl-10 py-2 text-xs"
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-5 py-2.5 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {loading ? 'Creating Account...' : 'Create & Activate Retailer'}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Success Credentials View */
          <div className="space-y-5 text-center py-2 animate-fade-in">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Retailer Account Created!</h3>
              <p className="text-xs text-slate-500 mt-1">
                The account has been created in the database. Share the credentials below with the store manager:
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between pb-1 border-b border-slate-200">
                <span className="text-slate-500">Store Name:</span>
                <span className="font-bold text-slate-800">{createdCredentials.businessName}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200">
                <span className="text-slate-500">Login Email:</span>
                <span className="font-bold text-indigo-600">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200">
                <span className="text-slate-500">Password:</span>
                <span className="font-bold text-slate-900 bg-amber-100 px-2 py-0.5 rounded">{createdCredentials.password}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Allocated Credits:</span>
                <span className="font-bold text-emerald-600">+{createdCredentials.credits} Credits</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
              >
                <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied to Clipboard!' : 'Copy Login Credentials'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

