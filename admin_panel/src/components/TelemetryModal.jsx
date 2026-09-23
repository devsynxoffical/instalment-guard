import React from 'react';
import { X, Smartphone, BatteryCharging, Cpu, HardDrive, Wifi, MapPin, ShieldCheck, Clock, Layers } from 'lucide-react';

export const TelemetryModal = ({ device, onClose }) => {
  if (!device) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smartphone size={22} color="#38BDF8" />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#F8FAFC' }}>
                {device.manufacturer} {device.model}
              </h3>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                Device ID: {device.deviceId} • IMEI: {device.imei || 'N/A'}
              </span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Overview Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={styles.metricBox}>
              <span style={styles.metricLabel}>Device Status</span>
              <span className={`badge ${device.isRestricted ? 'badge-danger' : 'badge-success'}`}>
                {device.deviceStatus}
              </span>
            </div>
            <div style={styles.metricBox}>
              <span style={styles.metricLabel}>MDM Policy</span>
              <span className="badge badge-info">
                {device.isDeviceOwner ? 'Device Owner' : 'Managed'}
              </span>
            </div>
            <div style={styles.metricBox}>
              <span style={styles.metricLabel}>Last Check-in</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#F8FAFC' }}>
                {new Date(device.lastCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Telemetry Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Battery Specs */}
            <div style={styles.specCard}>
              <div style={styles.specHeader}>
                <BatteryCharging size={18} color="#10B981" />
                <span>Battery & Power</span>
              </div>
              <div style={styles.specRow}>
                <span>Battery Level:</span>
                <strong>{device.batteryLevel}%</strong>
              </div>
              <div style={styles.specRow}>
                <span>Charging State:</span>
                <strong>{device.isCharging ? '🔌 Charging' : '🔋 Discharging'}</strong>
              </div>
            </div>

            {/* RAM & CPU */}
            <div style={styles.specCard}>
              <div style={styles.specHeader}>
                <Cpu size={18} color="#38BDF8" />
                <span>Memory & Hardware</span>
              </div>
              <div style={styles.specRow}>
                <span>RAM Available:</span>
                <strong>{device.availRamMb} MB free / {device.totalRamMb} MB</strong>
              </div>
              <div style={styles.specRow}>
                <span>Processor / Hardware:</span>
                <strong>{device.hardware || 'Octa-Core'}</strong>
              </div>
            </div>

            {/* Storage */}
            <div style={styles.specCard}>
              <div style={styles.specHeader}>
                <HardDrive size={18} color="#F59E0B" />
                <span>Internal Storage</span>
              </div>
              <div style={styles.specRow}>
                <span>Available Storage:</span>
                <strong>{device.availStorageGb} GB free</strong>
              </div>
              <div style={styles.specRow}>
                <span>Total Capacity:</span>
                <strong>{device.totalStorageGb} GB</strong>
              </div>
            </div>

            {/* Network & IP */}
            <div style={styles.specCard}>
              <div style={styles.specHeader}>
                <Wifi size={18} color="#8B5CF6" />
                <span>Network & Connectivity</span>
              </div>
              <div style={styles.specRow}>
                <span>Connection Type:</span>
                <strong>{device.connectionType || 'Wi-Fi'}</strong>
              </div>
              <div style={styles.specRow}>
                <span>IP Address:</span>
                <strong>{device.ipAddress}</strong>
              </div>
            </div>
          </div>

          {/* OS & Display Specs */}
          <div style={styles.specCard}>
            <div style={styles.specHeader}>
              <Layers size={18} color="#3B82F6" />
              <span>OS Specs & Display Metrics</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '6px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Android Version</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>Android {device.androidVersion} (SDK {device.sdkVersion})</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Security Patch</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>{device.securityPatch || '2026-08-01'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Display Resolution</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>{device.resolution} @ {device.densityDpi} dpi</div>
              </div>
            </div>
          </div>

          {/* Location Map Preview Card */}
          <div style={styles.specCard}>
            <div style={styles.specHeader}>
              <MapPin size={18} color="#EF4444" />
              <span>Live GPS Location Coordinates</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                  Lat: {device.latitude} | Lng: {device.longitude}
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Linked Retailer: {device.retailerName}</div>
              </div>
              <a
                href={`https://www.google.com/maps?q=${device.latitude},${device.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                View on Google Maps
              </a>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  metricBox: {
    background: '#0F172A',
    border: '1px solid #243147',
    borderRadius: '10px',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricLabel: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '600',
  },
  specCard: {
    background: '#0F172A',
    border: '1px solid #243147',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  specHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '1px solid #1E293B',
  },
  specRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#94A3B8',
    margin: '6px 0',
  },
};
