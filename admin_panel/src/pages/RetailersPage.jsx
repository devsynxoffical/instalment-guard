import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import {
  Building2,
  Search,
  PlusCircle,
  Coins,
  UserX,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { TableSkeleton } from '../components/SkeletonLoader';
import { PAKISTAN_CITIES } from '../constants/cities';

export const RetailersPage = () => {
  const navigate = useNavigate();
  const { retailers, toggleRetailerStatus, deleteRetailer, loading } = useAuth();
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
    } catch (err) {
      showToast('Failed to change retailer status.', 'error');
    }
  };

  const handleDeleteRetailer = async (e, retailerId, name) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove retailer "${name}"? This action will also delete associated devices and contracts.`)) {
      try {
        await deleteRetailer(retailerId);
        showToast(`Retailer "${name}" removed successfully`, 'success');
      } catch (err) {
        showToast('Failed to remove retailer.', 'error');
      }
    }
  };

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[{ label: 'Retailers' }]}
        title="Retailers Directory & Licenses"
        description="Super Admin management for partner stores, license credit distribution, and status controls"
        action={
          <button
            onClick={() => navigate('/retailers/new')}
            className="btn-primary"
          >
            <PlusCircle className="w-5 h-5" /> Add New Retailer
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="teal-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search by store name, owner, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto pl-0 md:pl-6 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="input-field cursor-pointer w-44 font-semibold text-xs"
          >
            <option value="ALL">All Cities ({PAKISTAN_CITIES.length})</option>
            {PAKISTAN_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
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
      <div className="teal-card rounded-2xl overflow-hidden">
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
                      onClick={() => navigate(`/retailers/${ret.id}`)}
                      className="hover:bg-teal-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors flex items-center gap-1.5">
                          {ret.businessName} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-teal-700" />
                        </div>
                        <div className="font-mono text-xs text-teal-700 mt-0.5">{ret.id}</div>
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
                            navigate(`/retailers/${ret.id}/credits`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-semibold transition-colors inline-flex items-center gap-1"
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

                        <button
                          onClick={(e) => handleDeleteRetailer(e, ret.id, ret.businessName)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                          title="Remove Retailer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
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
