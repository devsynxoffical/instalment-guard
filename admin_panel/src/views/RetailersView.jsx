import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  Search,
  PlusCircle,
  Coins,
  ShieldCheck,
  UserX,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { TableSkeleton } from '../components/SkeletonLoader';

export const RetailersView = ({ onAllocateCredits, onOpenCreateRetailer, onSelectRetailer }) => {
  const { retailers, toggleRetailerStatus, loading } = useAuth();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredRetailers = retailers.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      r.businessName.toLowerCase().includes(term) ||
      r.ownerName.toLowerCase().includes(term) ||
      (r.phone && r.phone.toLowerCase().includes(term)) ||
      r.id.toLowerCase().includes(term);

    const matchesCity = cityFilter === 'ALL' || r.city === cityFilter;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

    return matchesSearch && matchesCity && matchesStatus;
  });

  const handleToggleStatus = async (e, retailerId, currentStatus, name) => {
    e.stopPropagation();
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await toggleRetailerStatus(retailerId, nextStatus);
      showToast(`Retailer ${name} status updated to ${nextStatus}`, 'info');
    } catch (error) {
      showToast('Failed to change retailer status.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600" /> Retailers Directory & License Manager
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Click any retailer store to view full store details, assigned devices, and active contracts
          </p>
        </div>

        <button
          onClick={onOpenCreateRetailer}
          className="btn-primary flex items-center gap-2 py-2.5 px-5 shadow-lg shadow-indigo-600/20"
        >
          <PlusCircle className="w-5 h-5" /> Add New Retailer Store
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by store name, owner, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="input-field cursor-pointer w-36"
          >
            <option value="ALL">All Cities</option>
            <option value="Karachi">Karachi</option>
            <option value="Lahore">Lahore</option>
            <option value="Rawalpindi">Rawalpindi</option>
            <option value="Islamabad">Islamabad</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field cursor-pointer w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {/* Retailers Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={7} />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Retailer Store & ID</th>
                  <th className="px-6 py-4">Owner & City</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Credits Balance</th>
                  <th className="px-6 py-4">Active Devices</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRetailers.length > 0 ? (
                  filteredRetailers.map((ret) => (
                    <tr
                      key={ret.id}
                      onClick={() => onSelectRetailer(ret)}
                      className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                          {ret.businessName} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                        </div>
                        <div className="font-mono text-xs text-indigo-600 mt-0.5">{ret.id}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{ret.ownerName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" /> {ret.city}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <div className="text-slate-700 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {ret.phone}
                        </div>
                        {ret.email && (
                          <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {ret.email}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-amber-600 font-mono text-base flex items-center gap-1">
                          <Coins className="w-4 h-4 text-amber-500" /> {ret.credits || 0}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Total Spent: Rs. {(ret.totalSpent || 0).toLocaleString()}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                        {ret.activeDevicesCount || 0} Devices
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`badge ${
                            ret.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {ret.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAllocateCredits(ret);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Coins className="w-3.5 h-3.5" /> Allocate Credits
                        </button>

                        <button
                          onClick={(e) => handleToggleStatus(e, ret.id, ret.status, ret.businessName)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-1 ${
                            ret.status === 'ACTIVE'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {ret.status === 'ACTIVE' ? (
                            <>
                              <UserX className="w-3.5 h-3.5" /> Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      No retailers found matching search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetailersView;
