import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Coins,
  Smartphone,
  FileText,
  UserCheck,
  UserX,
  ChevronRight,
  Trash2,
  Key,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const RetailerDetailPage = () => {
  const { retailerId } = useParams();
  const navigate = useNavigate();
  const { retailers, devices, contracts, toggleRetailerStatus, deleteRetailer } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('devices');
  const [newPassword, setNewPassword] = useState('');
  const [settingPassword, setSettingPassword] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const retailer = retailers.find((r) => r.id === retailerId) || retailers[0];

  if (!retailer) {
    return (
      <div className="page-container py-12 text-center text-slate-500">
        Retailer store not found.{' '}
        <button onClick={() => navigate('/retailers')} className="text-teal-700 font-bold underline">
          Back to Directory
        </button>
      </div>
    );
  }

  const retailerDevices = devices.filter((d) => d.retailerId === retailer.id);
  const retailerContracts = contracts.filter((c) => c.retailerId === retailer.id);

  const handleToggleStatus = async () => {
    try {
      const nextStatus = retailer.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await toggleRetailerStatus(retailer.id, nextStatus);
      showToast(`Retailer ${retailer.businessName} status updated to ${nextStatus}`, 'info');
    } catch (err) {
      showToast('Failed to change status.', 'error');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    setSettingPassword(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/retailers/${retailer.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Retailer Mobile App password updated successfully!', 'success');
        setNewPassword('');
      } else {
        showToast(data.message || 'Failed to update password', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed connecting to backend server', 'error');
    } finally {
      setSettingPassword(false);
    }
  };

  const copyEmail = () => {
    if (retailer.email) {
      navigator.clipboard.writeText(retailer.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
      showToast('Retailer email copied to clipboard!', 'info');
    }
  };

  const handleDeleteRetailer = async () => {
    if (window.confirm(`Are you sure you want to remove retailer "${retailer.businessName}"? This action will also delete associated devices and contracts.`)) {
      try {
        await deleteRetailer(retailer.id);
        showToast(`Retailer "${retailer.businessName}" removed successfully`, 'success');
        navigate('/retailers');
      } catch (err) {
        showToast('Failed to remove retailer.', 'error');
      }
    }
  };

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[{ label: 'Retailers', path: '/retailers' }, { label: retailer.businessName }]}
        title={retailer.businessName}
        description={`Store ID: ${retailer.id} • City: ${retailer.city}`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/retailers/${retailer.id}/credits`)}
              className="btn-primary bg-amber-600 hover:bg-amber-700 font-bold"
            >
              <Coins className="w-4 h-4" /> Allocate Credits
            </button>
            <button
              onClick={handleToggleStatus}
              className={retailer.status === 'ACTIVE' ? 'btn-danger font-bold' : 'btn-primary font-bold'}
            >
              {retailer.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              {retailer.status === 'ACTIVE' ? 'Suspend Store' : 'Activate Store'}
            </button>
            <button
              onClick={handleDeleteRetailer}
              className="px-3.5 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Delete Store
            </button>
          </div>
        }
      />

      {/* Retailer Mobile App Credentials Banner */}
      <div className="teal-card p-6 bg-gradient-to-r from-teal-900/5 via-slate-900/5 to-transparent border border-teal-200/60 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-700 text-white shadow-sm">
                <Smartphone className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Retailer Mobile App Credentials</h3>
                <p className="text-xs text-slate-500">Provide these credentials to the partner store to log into the Installment Guard Retailer Android App.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● App Login Enabled
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Login Username / Email</div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-slate-800 select-all">{retailer.email || 'No email set'}</span>
              <button
                type="button"
                onClick={copyEmail}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                title="Copy Email"
              >
                {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Used by retailer on the mobile login screen</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Set / Reset App Password</div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="New password (e.g. Retailer@123)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field pl-9 py-2 text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={settingPassword || !newPassword}
                className="btn-primary py-2 px-3 text-xs font-bold whitespace-nowrap"
              >
                {settingPassword ? 'Saving...' : 'Update Password'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Changes take effect immediately on next mobile app login</p>
          </form>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="teal-card p-5 space-y-1">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">License Credits</div>
          <div className="text-2xl font-bold text-amber-600 font-mono flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" /> {retailer.credits || 0} Credits
          </div>
          <div className="text-xs text-slate-500 pt-1">Total Spent: Rs. {(retailer.totalSpent || 0).toLocaleString()}</div>
        </div>

        <div className="teal-card p-5 space-y-1">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Devices</div>
          <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-sky-600" /> {retailerDevices.length} Enrolled
          </div>
          <div className="text-xs text-slate-500 pt-1">Active Lock Tasks Enforced</div>
        </div>

        <div className="teal-card p-5 space-y-1">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Owner Contact</div>
          <div className="text-sm font-bold text-slate-900">{retailer.ownerName}</div>
          <div className="text-xs text-slate-500 font-mono">{retailer.phone}</div>
          <div className="text-xs text-slate-500">{retailer.email}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('devices')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'devices'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Smartphone className="w-4 h-4" /> Enrolled Devices ({retailerDevices.length})
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'contracts'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Installment Contracts ({retailerContracts.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="teal-card rounded-2xl overflow-hidden p-4">
        {activeTab === 'devices' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Device Model</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Lock Status</th>
                  <th className="px-4 py-3">IMEI</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {retailerDevices.length > 0 ? (
                  retailerDevices.map((d) => (
                    <tr key={d.deviceId} className="hover:bg-teal-50/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{d.model}</td>
                      <td className="px-4 py-3 text-xs">{d.customerName}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${d.isRestricted ? 'badge-danger' : 'badge-success'}`}>
                          {d.isRestricted ? 'RESTRICTED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.imei}</td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/devices/${d.deviceId}`} className="btn-secondary py-1 px-2.5 text-xs font-bold">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                      No devices enrolled under this store yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Contract ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total Price</th>
                  <th className="px-4 py-3">Remaining Balance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {retailerContracts.length > 0 ? (
                  retailerContracts.map((c) => (
                    <tr key={c.contractId} className="hover:bg-teal-50/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-teal-800">{c.contractId}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-900">{c.customerName}</td>
                      <td className="px-4 py-3 font-mono text-xs">Rs. {(c.totalPrice || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-xs text-rose-700 font-bold">
                        Rs. {(c.remainingBalance || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-info font-bold">{c.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                      No installment contracts logged for this store yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
