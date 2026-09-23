import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, Unlock, RefreshCw, EyeOff, Eye, Trash2, X } from 'lucide-react';

export const CommandActionModal = ({ device, onClose }) => {
  const { dispatchCommand } = useAuth();
  const [selectedCommand, setSelectedCommand] = useState('RESTRICT_DEVICE');
  const [loading, setLoading] = useState(false);

  if (!device) return null;

  const commandsList = [
    {
      type: 'RESTRICT_DEVICE',
      label: 'Lock Device (Trigger Overdue Screen)',
      desc: 'Enforces native Android lock task & displays red overdue installment overlay.',
      icon: Lock,
      color: '#EF4444',
      badgeClass: 'btn-danger',
    },
    {
      type: 'REMOVE_RESTRICTION',
      label: 'Unlock Device (Restore Full Access)',
      desc: 'Clears lock task & restores standard mobile phone functionality.',
      icon: Unlock,
      color: '#10B981',
      badgeClass: 'btn-success',
    },
    {
      type: 'SYNC_DEVICE',
      label: 'Force Telemetry Check-in Sync',
      desc: 'Requests immediate live status check-in (Battery, Storage, RAM, IP, GPS).',
      icon: RefreshCw,
      color: '#38BDF8',
      badgeClass: 'btn-primary',
    },
    {
      type: 'HIDE_APP',
      label: 'Hide App Launcher Icon',
      desc: 'Hides Installment Guard launcher icon from home screen & app drawer.',
      icon: EyeOff,
      color: '#F59E0B',
      badgeClass: 'btn-secondary',
    },
    {
      type: 'UNHIDE_APP',
      label: 'Restore App Launcher Icon',
      desc: 'Makes Installment Guard icon visible on launcher.',
      icon: Eye,
      color: '#8B5CF6',
      badgeClass: 'btn-secondary',
    },
  ];

  const handleDispatch = () => {
    setLoading(true);
    setTimeout(() => {
      dispatchCommand(device.deviceId, selectedCommand);
      setLoading(false);
      onClose();
    }, 400);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={22} color="#EF4444" />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#F8FAFC' }}>
                Remote Device Security Command Dispatcher
              </h3>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                Target: {device.manufacturer} {device.model} ({device.deviceId})
              </span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>
            Select an administrative security command to dispatch to this mobile device over the background heartbeat channel:
          </p>

          {commandsList.map((cmd) => {
            const Icon = cmd.icon;
            const isSelected = selectedCommand === cmd.type;
            return (
              <div
                key={cmd.type}
                onClick={() => setSelectedCommand(cmd.type)}
                style={{
                  ...styles.cmdBox,
                  borderColor: isSelected ? cmd.color : '#243147',
                  background: isSelected ? `${cmd.color}15` : '#0F172A',
                }}
              >
                <div style={{ ...styles.iconCircle, background: `${cmd.color}20`, color: cmd.color }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#F8FAFC' }}>
                    {cmd.label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '3px' }}>
                    {cmd.desc}
                  </div>
                </div>
                <input
                  type="radio"
                  checked={isSelected}
                  onChange={() => setSelectedCommand(cmd.type)}
                  style={{ accentColor: cmd.color, transform: 'scale(1.2)' }}
                />
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleDispatch} disabled={loading}>
            {loading ? 'Dispatching Command...' : `Dispatch ${selectedCommand}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  cmdBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid #243147',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  iconCircle: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
