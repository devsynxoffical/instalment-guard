import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Coins,
  Smartphone,
  FileText,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  ChevronRight,
} from 'lucide-react';

export const RetailerDetailModal = ({ retailer, onClose, onAllocateCredits, onToggleStatus }) => {
  const { devices, contracts } = useAuth();
  const [activeTab, setActiveTab] = useState('devices');

  if (!retailer) return null;

  const retailerDevices = devices.filter((d) => d.retailerId === retailer.id);
  const retailerContracts = contracts.filter((c) => c.retailerId === retailer.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white max-w-3xl w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between relative">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{retailer.businessName}</h2>
                <span
                  className={`badge ${
                    retailer.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  } text-xs`}
                >
                  {retailer.status}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1 font-mono">
                Retailer ID: {retailer.id} • Registered: {retailer.createdAt || '2026-07-10'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Retailer Information Grid */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 font-medium">Owner & Contact</span>
            <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" /> {retailer.ownerName}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {retailer.phone}
            </div>
            {retailer.email && (
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {retailer.email}
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 font-medium">Location & City</span>
            <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-500" /> {retailer.city}
            </div>
            <div className="text-xs text-slate-500 leading-tight">
              {retailer.address || 'Commercial Market Store'}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 font-medium">License Credits</span>
            <div className="font-extrabold text-amber-600 text-lg font-mono flex items-center gap-1">
              <Coins className="w-5 h-5 text-amber-500" /> {retailer.credits || 0} Credits
            </div>
            <div className="text-xs text-slate-500">
              Total Spent: Rs. {(retailer.totalSpent || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('devices')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeTab === 'devices'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" /> Enrolled Devices ({retailerDevices.length})
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeTab === 'contracts'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" /> Active Contracts ({retailerContracts.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onAllocateCredits(retailer);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Coins className="w-3.5 h-3.5" /> Allocate Credits
            </button>
            <button
              onClick={() => {
                onToggleStatus(retailer.id, retailer.status, retailer.businessName);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-colors ${
                retailer.status === 'ACTIVE'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {retailer.status === 'ACTIVE' ? (
                <>
                  <UserX className="w-3.5 h-3.5" /> Suspend
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" /> Activate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
          {activeTab === 'devices' ? (
            <div className="space-y-3">
              {retailerDevices.length > 0 ? (
                retailerDevices.map((dev) => (
                  <div
                    key={dev.deviceId}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{dev.model}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        ID: {dev.deviceId} • Customer: {dev.customerName} ({dev.customerPhone})
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`badge ${
                          dev.isRestricted ? 'badge-danger' : 'badge-success'
                        } text-[11px]`}
                      >
                        {dev.isRestricted ? 'RESTRICTED' : 'ACTIVE'}
                      </span>
                      <span className="text-xs text-emerald-600 font-semibold">
                        {dev.batteryLevel || 85}% Battery
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No devices enrolled by this retailer store yet.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {retailerContracts.length > 0 ? (
                retailerContracts.map((c) => (
                  <div
                    key={c.contractId}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm font-mono">{c.contractId}</div>
                      <div className="text-xs text-slate-500">
                        Customer: {c.customerName} • Device: {c.deviceModel}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 text-sm font-mono">
                        Remaining: Rs. {(c.remainingBalance || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Due: {c.nextDueDate || '2026-10-10'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No installment contracts found for this retailer.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
