import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Smartphone, User, DollarSign, Calendar, X, AlertCircle } from 'lucide-react';

export const EnrollDeviceModal = ({ onClose }) => {
  const { enrollDevice, activeRetailer } = useAuth();
  const [formData, setFormData] = useState({
    customerName: '',
    customerCnic: '',
    customerPhone: '',
    manufacturer: '',
    brand: '',
    model: '',
    imei: '',
    totalPrice: '',
    downPayment: '',
    monthlyInstallment: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (activeRetailer.credits < 1) {
      setError('Insufficient License Credits! Please request Super Admin to allocate credits.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        enrollDevice(formData);
        setLoading(false);
        onClose();
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smartphone size={22} color="#38BDF8" />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#F8FAFC' }}>
                Enroll New Customer Mobile
              </h3>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                Consumes 1 License Credit • Available: <strong style={{ color: '#F59E0B' }}>{activeRetailer.credits}</strong>
              </span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={styles.errorBox}>
                <AlertCircle size={18} color="#EF4444" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Details */}
            <div style={styles.sectionTitle}>
              <User size={16} color="#38BDF8" />
              <span>Customer Information</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Hamza"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Device Hardware Specs */}
            <div style={styles.sectionTitle}>
              <Smartphone size={16} color="#38BDF8" />
              <span>Device Specifications</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Manufacturer</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phone Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">IMEI Number (15 Digits)</label>
                <input
                  type="text"
                  value={formData.imei}
                  onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Installment Financial Terms */}
            <div style={styles.sectionTitle}>
              <DollarSign size={16} color="#38BDF8" />
              <span>Installment Financial Terms</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Total Device Price (PKR)</label>
                <input
                  type="number"
                  value={formData.totalPrice}
                  onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Down Payment (PKR)</label>
                <input
                  type="number"
                  value={formData.downPayment}
                  onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Monthly Installment (PKR)</label>
                <input
                  type="number"
                  value={formData.monthlyInstallment}
                  onChange={(e) => setFormData({ ...formData, monthlyInstallment: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registering Device...' : 'Enroll Mobile (Use 1 Credit)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: '6px',
    paddingBottom: '6px',
    borderBottom: '1px solid #243147',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '13px',
    color: '#EF4444',
  },
};
