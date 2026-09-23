import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Smartphone, User, FileText, Coins, CheckCircle, ShieldAlert, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { deviceService } from '../services/deviceService';

export const EnrollDevicePage = () => {
  const navigate = useNavigate();
  const { enrollDevice, activeRetailer, role } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerCnic: '',
    brand: 'Realme',
    model: '',
    manufacturer: 'Realme',
    imei: '',
    assetCategory: 'MOBILE_PHONE',
    totalPrice: '50000',
    downPayment: '10000',
    monthlyInstallment: '5000',
    dueDateDay: '10',
    nextDueDate: '2026-10-10',
    sendReminderSms: true,
    contractImageUrl: '',
    cnicImageUrl: '',
  });

  const [creditBadge, setCreditBadge] = useState(null);
  const [loading, setLoading] = useState(false);

  const creditsAvailable = role === 'SUPER_ADMIN' ? 1000 : activeRetailer?.credits || 0;

  const handleCnicChange = async (val) => {
    setFormData((prev) => ({ ...prev, customerCnic: val }));
    if (val.length >= 13) {
      const res = await deviceService.checkCreditScore(val, formData.customerPhone);
      setCreditBadge(res);
    } else {
      setCreditBadge(null);
    }
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = scaleSize < 1 ? MAX_WIDTH : img.width;
          canvas.height = scaleSize < 1 ? img.height * scaleSize : img.height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormData((prev) => ({ ...prev, [field]: compressedDataUrl }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName || !formData.customerPhone || !formData.model) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (creditsAvailable < 1) {
      showToast('Insufficient Enrollment Credits! Please request credits from Super Admin.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await enrollDevice(formData);
      showToast(
        `Device ${formData.model} enrolled successfully! 1 Credit Consumed. Contract ID: ${res.newContract?.contractId}`,
        'success'
      );
      navigate(`/devices/${res.newDevice?.deviceId}`);
    } catch (err) {
      showToast(err.message || 'Failed to enroll device.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[{ label: 'Devices', path: '/devices' }, { label: 'Enroll Device' }]}
        title="Enroll New Customer Device"
        description="Register an installment purchase contract and attach protection device policies"
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Credit Check Banner */}
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-700 text-white">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">License Credit Verification</div>
              <div className="text-xs text-slate-600">
                Enrollment consumes 1 credit. Remaining balance:{' '}
                <strong className="text-teal-800">{creditsAvailable} Credits</strong>
              </div>
            </div>
          </div>

          <span className="badge badge-success">READY TO ENROLL</span>
        </div>

        {/* Realtime CNIC Credit Status Badge */}
        {creditBadge && (
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            creditBadge.riskLevel === 'DEFAULTER'
              ? 'bg-red-50 border-red-300 text-red-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            <div className="flex items-center gap-3">
              {creditBadge.riskLevel === 'DEFAULTER' ? (
                <ShieldAlert className="w-6 h-6 text-red-600" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              )}
              <div>
                <div className="font-bold text-sm">
                  Customer Score: <span className="font-mono text-base">{creditBadge.creditScore}</span> ({creditBadge.riskLevel})
                </div>
                <div className="text-xs mt-0.5">{creditBadge.recommendation}</div>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Customer Info */}
        <div className="teal-card p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <User className="w-5 h-5 text-teal-700" /> Customer Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Muhammad Hamza"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+92 300 1234567"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer CNIC Number</label>
              <input
                type="text"
                placeholder="42101-1234567-1"
                value={formData.customerCnic}
                onChange={(e) => handleCnicChange(e.target.value)}
                className="input-field font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Device Specs */}
        <div className="teal-card p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <Smartphone className="w-5 h-5 text-teal-700" /> Mobile Device Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Manufacturer / Brand</label>
              <select
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value, manufacturer: e.target.value })
                }
                className="input-field cursor-pointer"
              >
                <option value="Realme">Realme</option>
                <option value="Samsung">Samsung</option>
                <option value="Xiaomi">Xiaomi / Redmi</option>
                <option value="Infinix">Infinix</option>
                <option value="Tecno">Tecno</option>
                <option value="Vivo">Vivo</option>
                <option value="Oppo">Oppo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Device Model *</label>
              <input
                type="text"
                required
                placeholder="e.g. Realme C53 (RMX3830)"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Device IMEI Number</label>
              <input
                type="text"
                placeholder="15-digit IMEI number"
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                className="input-field font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Document Upload */}
        <div className="teal-card p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <ImageIcon className="w-5 h-5 text-teal-700" /> Contract Document & CNIC Upload
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Physical Signed Contract Agreement Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'contractImageUrl')}
                className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-teal-700 file:text-white file:font-semibold hover:file:bg-teal-800 cursor-pointer"
              />
              {formData.contractImageUrl && (
                <img src={formData.contractImageUrl} alt="Contract Preview" className="h-24 w-auto rounded-lg border border-slate-200 mt-2 object-cover" />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer CNIC Card Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'cnicImageUrl')}
                className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-teal-700 file:text-white file:font-semibold hover:file:bg-teal-800 cursor-pointer"
              />
              {formData.cnicImageUrl && (
                <img src={formData.cnicImageUrl} alt="CNIC Preview" className="h-24 w-auto rounded-lg border border-slate-200 mt-2 object-cover" />
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Installment Terms */}
        <div className="teal-card p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <FileText className="w-5 h-5 text-teal-700" /> Installment Terms & Pricing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Total Phone Price (PKR)</label>
              <input
                type="number"
                min="1"
                value={formData.totalPrice}
                onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Down Payment Received (PKR)</label>
              <input
                type="number"
                min="0"
                value={formData.downPayment}
                onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Installment Amount (PKR)</label>
              <input
                type="number"
                min="1"
                value={formData.monthlyInstallment}
                onChange={(e) => setFormData({ ...formData, monthlyInstallment: e.target.value })}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Due Day (Day of Month) *</label>
              <select
                value={formData.dueDateDay}
                onChange={(e) => {
                  const day = e.target.value;
                  const month = new Date().getMonth() + 2; // Next month
                  const year = new Date().getFullYear();
                  const formattedMonth = month > 12 ? '01' : String(month).padStart(2, '0');
                  const formattedDay = String(day).padStart(2, '0');
                  setFormData({
                    ...formData,
                    dueDateDay: day,
                    nextDueDate: `${year}-${formattedMonth}-${formattedDay}`,
                  });
                }}
                className="input-field cursor-pointer font-bold"
              >
                <option value="1">1st of Every Month</option>
                <option value="5">5th of Every Month</option>
                <option value="10">10th of Every Month</option>
                <option value="15">15th of Every Month</option>
                <option value="20">20th of Every Month</option>
                <option value="25">25th of Every Month</option>
                <option value="30">30th of Every Month</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">First Installment Next Due Date *</label>
              <input
                type="date"
                required
                value={formData.nextDueDate}
                onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                className="input-field font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-2.5 rounded-xl w-full">
                <input
                  type="checkbox"
                  checked={formData.sendReminderSms}
                  onChange={(e) => setFormData({ ...formData, sendReminderSms: e.target.checked })}
                  className="rounded text-teal-700 focus:ring-teal-500 w-4 h-4"
                />
                <span>🔔 Auto SMS/Push Due Reminder Alert</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate('/devices')}
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
            {loading ? 'Processing Enrollment...' : 'Submit & Enroll Device'}
          </button>
        </div>
      </form>
    </div>
  );
};
