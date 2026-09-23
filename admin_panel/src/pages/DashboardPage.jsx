import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Smartphone,
  ShieldAlert,
  Coins,
  CreditCard,
  PlusCircle,
  Activity,
  ArrowRight,
  TrendingUp,
  Clock,
  UserCheck,
  Search,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  DollarSign,
  Plus,
  Tv,
  Refrigerator,
} from 'lucide-react';
import { TableSkeleton } from '../components/SkeletonLoader';
import { getDevicePaymentStatus } from '../utils/paymentHelper';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { role, retailers, devices, contracts, payments, auditLogs, activeRetailer, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDevices = devices.filter((d) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.model?.toLowerCase().includes(term) ||
      d.deviceId?.toLowerCase().includes(term) ||
      (d.customerName && d.customerName.toLowerCase().includes(term)) ||
      (d.customerPhone && d.customerPhone.toLowerCase().includes(term)) ||
      (d.imei && d.imei.toLowerCase().includes(term)) ||
      (d.retailerName && d.retailerName.toLowerCase().includes(term))
    );
  });

  const totalRetailersCount = retailers.length;
  const activeRetailersCount = retailers.filter((r) => r.status === 'ACTIVE').length;

  const totalDevicesCount = devices.length;
  const activeDevicesCount = devices.filter((d) => !d.isRestricted && d.deviceStatus !== 'COMPLETED').length;
  const restrictedDevicesCount = devices.filter((d) => d.isRestricted).length;

  const overdueContractsCount = contracts.filter((c) => c.status === 'RESTRICTED' || c.status === 'OVERDUE').length;
  const totalCollections = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalRemainingBalance = contracts.reduce((acc, c) => acc + (c.remainingBalance || 0), 0);
  const totalPortfolioValue = totalCollections + totalRemainingBalance;
  const collectionRate = totalPortfolioValue > 0 ? Math.round((totalCollections / totalPortfolioValue) * 100) : 100;

  const totalDistributedCredits = retailers.reduce((acc, r) => acc + (r.credits || 0), 0);
  const availableCredits = role === 'SUPER_ADMIN' ? `${totalDistributedCredits} Distributed` : `${activeRetailer?.credits || 0} Credits`;

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-sans max-w-[1600px] mx-auto">
      
      {/* 4x2 Stat Cards Grid (8 Metric Cards Total - NO CHARTS / GRAPHS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Managed Devices */}
        <div className="light-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">ACTIVE MANAGED DEVICES</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display">{activeDevicesCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-emerald-600 font-bold">↗ Hardware telemetry active</span>
          </div>
        </div>

        {/* Card 2: Locked & Overdue Devices */}
        <div className="light-card p-4 flex flex-col justify-between border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">LOCKED & OVERDUE</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-rose-600 font-display">{restrictedDevicesCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-rose-600 font-bold">{overdueContractsCount} Overdue</span>
            <span className="text-slate-400">payments pending</span>
          </div>
        </div>

        {/* Card 3: Today's Collections */}
        <div className="light-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">TOTAL COLLECTIONS</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Rs. {totalCollections.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-emerald-600 font-bold">↗ {collectionRate}%</span>
            <span className="text-slate-400">recovery rate</span>
          </div>
        </div>

        {/* Card 4: Total Active Contracts */}
        <div className="light-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">TOTAL CONTRACTS</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display">{contracts.length}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-500 font-semibold">Multi-appliance plans</span>
          </div>
        </div>

        {/* Card 5: Partner Retailers */}
        <div className="light-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">PARTNER RETAILERS</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display">{totalRetailersCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-emerald-600 font-bold">{activeRetailersCount} Active</span>
            <span className="text-slate-400">registered stores</span>
          </div>
        </div>

        {/* Card 6: Portfolio Financed Volume */}
        <div className="light-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">PORTFOLIO VOLUME</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Rs. {totalPortfolioValue.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-emerald-600 font-bold">↗ Total financed</span>
          </div>
        </div>

        {/* Card 7: Outstanding Customer Dues */}
        <div className="light-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">OUTSTANDING DUES</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Rs. {totalRemainingBalance.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-amber-600 font-bold">Pending balance</span>
          </div>
        </div>

        {/* Card 8: Credit & Defaulter Scans */}
        <div className="light-card p-4 flex flex-col justify-between border-l-4 border-l-amber-400">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">DEFAULTER SCANS</span>
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display">100%</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-emerald-600 font-bold">0 Fraud Alerts</span>
            <span className="text-slate-400">pending</span>
          </div>
        </div>
      </div>

      {/* Horizontal System Status Banner */}
      <div className="light-card p-4 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Device Policy Engine</span>
          <span className="text-sm font-extrabold text-emerald-400">100% Active</span>
        </div>

        <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Hardware Telemetry</span>
          <span className="text-sm font-extrabold text-white">Synchronized</span>
        </div>

        <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">License Credits Pool</span>
          <span className="text-sm font-extrabold text-amber-400">{availableCredits}</span>
        </div>

        <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">High Risk Alerts</span>
          <span className="text-sm font-extrabold text-emerald-400">0 Pending</span>
        </div>
      </div>

      {/* Quick Action Control Center Grid (Fills blank area with rich interactive cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-display">
            <Zap className="w-4 h-4 text-amber-500" /> Quick Operations Control Center
          </h2>
          <span className="text-xs text-slate-500 font-semibold">Fast actions for store staff & admins</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Enroll Device */}
          <div 
            onClick={() => navigate('/devices/enroll')}
            className="light-card p-4 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group bg-white flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-slate-900 text-amber-400 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">Knox MDM</span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">Enroll Hardware Device</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Register customer mobile/tablet for lock enforcement</p>
            </div>
            <div className="flex items-center text-xs font-bold text-slate-900 group-hover:text-amber-600 gap-1 pt-1">
              Start Enrollment <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Action 2: Record Payment */}
          <div 
            onClick={() => navigate('/payments/new')}
            className="light-card p-4 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group bg-white flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">Instant EMI</span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">Record Installment Payment</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Log cash or online payment & auto-unlock device</p>
            </div>
            <div className="flex items-center text-xs font-bold text-slate-900 group-hover:text-emerald-600 gap-1 pt-1">
              Record Payment <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Action 3: Defaulter Check */}
          <div 
            onClick={() => navigate('/credit-check')}
            className="light-card p-4 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group bg-white flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">P2P Network</span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">Defaulter & Credit Check</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Scan CNIC/IMEI across all retail stores before sale</p>
            </div>
            <div className="flex items-center text-xs font-bold text-slate-900 group-hover:text-amber-600 gap-1 pt-1">
              Verify Customer <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Action 4: Appliance Finance */}
          <div 
            onClick={() => navigate('/contracts')}
            className="light-card p-4 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group bg-white flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] bg-sky-100 text-sky-900 font-bold px-2 py-0.5 rounded-full">Multi-Appliance</span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">Finance & Contracts</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Manage agreements for Mobiles, Refrigerators & TVs</p>
            </div>
            <div className="flex items-center text-xs font-bold text-slate-900 group-hover:text-sky-600 gap-1 pt-1">
              View Contracts <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Devices Ledger & Contracts (70%) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Enrolled Devices & Telemetry Card */}
          <div className="light-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-900 text-amber-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-sm font-display">Enrolled Devices & Live Telemetry</h2>
                  <p className="text-[11px] text-slate-500">Real-time status, battery %, and remote restriction controls</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/devices/enroll')}
                  className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Enroll
                </button>
                <Link
                  to="/devices"
                  className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <TableSkeleton rows={4} cols={6} />
              ) : (
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-3.5 py-2.5">Device & Model</th>
                      <th className="px-3.5 py-2.5">Customer</th>
                      <th className="px-3.5 py-2.5">Retailer (Sold By)</th>
                      <th className="px-3.5 py-2.5">Payment Status</th>
                      <th className="px-3.5 py-2.5">Lock Status</th>
                      <th className="px-3.5 py-2.5">Battery</th>
                      <th className="px-3.5 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDevices.length > 0 ? (
                      filteredDevices.slice(0, 6).map((dev) => {
                        const payInfo = getDevicePaymentStatus(dev, contracts);
                        const storeName = retailers.find((r) => r.id === dev.retailerId)?.businessName || dev.retailerName || 'Partner Store';

                        return (
                          <tr
                            key={dev.deviceId}
                            onClick={() => navigate(`/devices/${dev.deviceId}`)}
                            className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                          >
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <div className="font-bold text-slate-900">{dev.model}</div>
                              <div className="font-mono text-[11px] text-slate-600 mt-0.5">{dev.deviceId}</div>
                            </td>

                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <div className="font-bold text-slate-900">{dev.customerName}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{dev.customerPhone}</div>
                            </td>

                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <div className="font-bold text-slate-900">{storeName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {dev.retailerId || 'RET-101'}</div>
                            </td>

                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${payInfo.badgeClass}`}>
                                {payInfo.label}
                              </span>
                            </td>

                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <span
                                className={`badge font-bold ${
                                  dev.isRestricted ? 'badge-danger' : 'badge-success'
                                }`}
                              >
                                {dev.isRestricted ? 'RESTRICTED' : 'ACTIVE'}
                              </span>
                            </td>

                            <td className="px-3.5 py-3 whitespace-nowrap font-bold">
                              <span className="text-emerald-700">{dev.batteryLevel || 85}%</span>
                              <span className="text-slate-400 font-normal text-[11px] ml-1">({dev.connectionType || 'Wi-Fi'})</span>
                            </td>

                            <td className="px-3.5 py-3 whitespace-nowrap text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/devices/${dev.deviceId}`);
                                }}
                                className="btn-secondary py-1 px-2.5 text-xs font-bold"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-10 text-center">
                          <div className="max-w-md mx-auto space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-sm">No Enrolled Devices Found</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Installment Guard allows you to lock customer smartphones & track installment recovery seamlessly.
                            </p>
                            <button
                              onClick={() => navigate('/devices/enroll')}
                              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs shadow-sm inline-flex items-center gap-1.5 transition-all"
                            >
                              <PlusCircle className="w-4 h-4" /> Enroll First Device
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Multi-Appliance Finance Contracts Ledger Card */}
          <div className="light-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-900 text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-sm font-display">Multi-Appliance Active Installment Contracts</h2>
                  <p className="text-[11px] text-slate-500">Mobiles, Refrigerators, LED TVs, and Air Conditioners financing agreements</p>
                </div>
              </div>

              <Link
                to="/contracts"
                className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center gap-1 transition-colors"
              >
                View All Contracts <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4">
              {contracts.length > 0 ? (
                <div className="space-y-3">
                  {contracts.slice(0, 4).map((c) => (
                    <div
                      key={c.contractId}
                      onClick={() => navigate(`/contracts/${c.contractId}`)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50/30 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-900 font-bold shrink-0">
                          {c.itemCategory === 'REFRIGERATOR' ? <Refrigerator className="w-4 h-4" /> : c.itemCategory === 'TV' ? <Tv className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs">{c.customerName}</div>
                          <div className="text-[11px] text-slate-500">{c.itemName || c.itemCategory || 'Financed Appliance'}</div>
                        </div>
                      </div>

                      <div className="text-left min-w-[120px]">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Financed Amount</div>
                        <div className="font-extrabold text-slate-900">Rs. {(c.totalPrice || 0).toLocaleString()}</div>
                      </div>

                      <div className="text-left min-w-[120px]">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Monthly EMI</div>
                        <div className="font-extrabold text-emerald-700">Rs. {(c.monthlyEmi || 0).toLocaleString()}</div>
                      </div>

                      <div className="text-left min-w-[110px]">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {c.status || 'ACTIVE'}
                        </span>
                      </div>

                      <div className="shrink-0">
                        <button className="px-3 py-1 rounded-lg bg-slate-100 text-slate-900 font-bold hover:bg-slate-200 text-xs transition-colors">
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                  No multi-appliance contracts created yet.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Crextio Focus & Activity Widgets (30%) */}
        <div className="space-y-6">
          
          {/* Crextio Dark Charcoal Widget */}
          <div className="crextio-dark-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-display">System Uptime</span>
              <span className="text-2xl font-extrabold text-white font-display">99.8%</span>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-bold text-white">Active Hardware Protection</div>
              <div className="text-xs text-stone-300 leading-relaxed">
                Automated Knox lock enforcement, anti-factory reset, and peer-to-peer defaulter alerts active.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="text-xs text-stone-300 font-semibold">{restrictedDevicesCount} Locked Devices</span>
              </div>
              <button
                onClick={() => navigate('/devices')}
                className="px-3.5 py-1.5 rounded-full bg-[#FACC15] text-slate-950 text-xs font-extrabold hover:bg-amber-400 transition-colors"
              >
                Inspect
              </button>
            </div>
          </div>

          {/* Portfolio Recovery Progress Card */}
          <div className="crextio-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 font-display">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Portfolio Recovery
              </h2>
              <span className="text-xs font-extrabold text-slate-900 bg-[#FACC15] px-3 py-1 rounded-full shadow-sm">
                {collectionRate}% Recovered
              </span>
            </div>

            {/* Crextio Capsule Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5 flex">
                <div
                  className="h-full bg-slate-900 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, collectionRate))}%` }}
                ></div>
                <div
                  className="h-full bg-[#FACC15] rounded-full transition-all duration-500"
                  style={{ width: `${100 - Math.min(100, Math.max(10, collectionRate))}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-600 font-mono">
                <span>Paid: Rs. {totalCollections.toLocaleString()}</span>
                <span>Due: Rs. {totalRemainingBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Logs Card */}
          <div className="crextio-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 font-display">
                <Clock className="w-4 h-4 text-slate-900" /> Security & Payment Activity
              </h2>
              <Link to="/audit-logs" className="text-xs font-bold text-slate-700 hover:text-slate-900 underline">
                View Logs
              </Link>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <div className="p-1.5 rounded-full bg-slate-900 text-amber-400 shrink-0 mt-0.5">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 truncate">{log.action}</div>
                    <div className="text-[11px] text-slate-500 truncate">{log.target}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
