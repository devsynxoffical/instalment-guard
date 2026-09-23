import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Coins, Building2, X } from 'lucide-react';

export const AllocateCreditsModal = ({ retailer, onClose }) => {
  const { allocateCredits } = useAuth();
  const [creditCount, setCreditCount] = useState(10);
  const [loading, setLoading] = useState(false);

  if (!retailer) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      allocateCredits(retailer.id, parseInt(creditCount, 10));
      setLoading(false);
      onClose();
    }, 400);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Coins size={22} color="#F59E0B" />
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#F8FAFC' }}>
              Allocate License Credits
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={styles.infoCard}>
              <Building2 size={20} color="#38BDF8" />
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#F8FAFC' }}>
                  {retailer.businessName}
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  Owner: {retailer.ownerName} ({retailer.city}) • Current Credits: <strong style={{ color: '#F59E0B' }}>{retailer.credits}</strong>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Number of Credits / Licenses to Add</label>
              <input
                type="number"
                min="1"
                max="500"
                value={creditCount}
                onChange={(e) => setCreditCount(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div style={styles.summaryBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8' }}>
                <span>Unit Price per Credit:</span>
                <span>Rs. 1,000 PKR</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '700', color: '#F8FAFC', marginTop: '8px' }}>
                <span>Total Transaction Amount:</span>
                <span style={{ color: '#10B981' }}>Rs. {(creditCount * 1000).toLocaleString()} PKR</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Processing...' : `Allocate +${creditCount} Credits`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  infoCard: {
    background: '#0F172A',
    border: '1px solid #243147',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  summaryBox: {
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '12px',
    padding: '14px 16px',
    marginTop: '16px',
  },
};
