import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Smartphone, FileText, Building2, User, X, ChevronRight } from 'lucide-react';

export const GlobalSearchDialog = ({ isOpen, onClose, onSelectDevice, onSelectContract }) => {
  const { devices, contracts, retailers } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const term = searchTerm.trim().toLowerCase();

  const matchingDevices = term
    ? devices.filter(
        (d) =>
          d.deviceId.toLowerCase().includes(term) ||
          d.model.toLowerCase().includes(term) ||
          (d.customerName && d.customerName.toLowerCase().includes(term)) ||
          (d.imei && d.imei.toLowerCase().includes(term))
      )
    : [];

  const matchingContracts = term
    ? contracts.filter(
        (c) =>
          c.contractId.toLowerCase().includes(term) ||
          (c.customerName && c.customerName.toLowerCase().includes(term)) ||
          (c.customerPhone && c.customerPhone.toLowerCase().includes(term))
      )
    : [];

  const matchingRetailers = term
    ? retailers.filter(
        (r) =>
          r.businessName.toLowerCase().includes(term) ||
          r.ownerName.toLowerCase().includes(term) ||
          r.city.toLowerCase().includes(term)
      )
    : [];

  const totalResults = matchingDevices.length + matchingContracts.length + matchingRetailers.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in">
      <div className="bg-white max-w-2xl w-full rounded-2xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[80vh]">
        {/* Search Header Input */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Global Search by Device ID, IMEI, Customer Name, Phone, Contract ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none font-sans"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!term ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Type a search query to scan devices, contracts, customer records, and retailers.
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No matching records found for "<span className="text-slate-900 font-semibold">{searchTerm}</span>".
            </div>
          ) : (
            <>
              {/* Devices Match */}
              {matchingDevices.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-700" /> Devices ({matchingDevices.length})
                  </h4>
                  <div className="space-y-2">
                    {matchingDevices.map((dev) => (
                      <div
                        key={dev.deviceId}
                        onClick={() => {
                          onSelectDevice(dev);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 cursor-pointer flex items-center justify-between transition-all group"
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                            {dev.model} <span className="font-mono text-xs text-amber-600 font-normal">({dev.deviceId})</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Customer: {dev.customerName} • IMEI: {dev.imei || 'N/A'}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contracts Match */}
              {matchingContracts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" /> Contracts ({matchingContracts.length})
                  </h4>
                  <div className="space-y-2">
                    {matchingContracts.map((c) => (
                      <div
                        key={c.contractId}
                        onClick={() => {
                          onSelectContract(c);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 cursor-pointer flex items-center justify-between transition-all group"
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors font-mono">
                            {c.contractId} — {c.customerName}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Remaining: Rs. {(c.remainingBalance || 0).toLocaleString()} • Phone: {c.customerPhone}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Retailers Match */}
              {matchingRetailers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-700" /> Retailers ({matchingRetailers.length})
                  </h4>
                  <div className="space-y-2">
                    {matchingRetailers.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {r.businessName} <span className="text-xs text-slate-500 font-normal">({r.city})</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Owner: {r.ownerName} • Credits: {r.credits}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
