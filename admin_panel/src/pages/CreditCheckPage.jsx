import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CreditCard,
  UserCheck,
  Building,
  MapPin,
  Calendar,
  FileText,
  Activity,
  Award,
  TrendingUp,
  RefreshCw,
  Tv,
  Laptop,
  Wind,
  Bike,
  Smartphone,
  Package,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Phone,
  Building2,
  DollarSign,
} from 'lucide-react';
import { deviceService } from '../services/deviceService';
import { useAuth } from '../context/AuthContext';

export function CreditCheckPage() {
  const navigate = useNavigate();
  const { contracts, devices, retailers, currentRetailer } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creditReport, setCreditReport] = useState(null);
  const [defaulterReport, setDefaulterReport] = useState(null);
  const [searched, setSearched] = useState(false);

  const getAssetIcon = (category) => {
    switch (category) {
      case 'SMART_TV':
        return <Tv className="w-4 h-4 text-purple-600" />;
      case 'LAPTOP':
        return <Laptop className="w-4 h-4 text-blue-600" />;
      case 'AIR_CONDITIONER':
      case 'REFRIGERATOR':
        return <Wind className="w-4 h-4 text-cyan-600" />;
      case 'MOTORBIKE':
        return <Bike className="w-4 h-4 text-emerald-600" />;
      case 'MOBILE_PHONE':
        return <Smartphone className="w-4 h-4 text-indigo-600" />;
      default:
        return <Package className="w-4 h-4 text-amber-600" />;
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setLoading(true);
    setSearched(true);
    try {
      const creditRes = await deviceService.checkCreditScore(query, query).catch(() => null);
      const defaulterRes = await deviceService.checkDefaulter(query, currentRetailer?.businessName || 'Current Store').catch(() => null);

      // Perform rich client-side search across active contracts & devices
      const cleanQ = query.toLowerCase().replace(/[^a-z0-9]/g, '');

      const matchingContracts = (contracts || []).filter((c) => {
        const cnicClean = (c.customerCnic || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const phoneClean = (c.customerPhone || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const nameClean = (c.customerName || '').toLowerCase();
        const modelClean = (c.deviceModel || '').toLowerCase();
        const serialClean = (c.serialNumber || '').toLowerCase();
        const idClean = (c.contractId || '').toLowerCase();

        return (
          cnicClean.includes(cleanQ) ||
          phoneClean.includes(cleanQ) ||
          nameClean.includes(query.toLowerCase()) ||
          modelClean.includes(query.toLowerCase()) ||
          serialClean.includes(cleanQ) ||
          idClean.includes(query.toLowerCase())
        );
      });

      const matchingDevices = (devices || []).filter((d) => {
        const imeiClean = (d.imei || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const idClean = (d.deviceId || '').toLowerCase();
        const nameClean = (d.customerName || '').toLowerCase();

        return (
          imeiClean.includes(cleanQ) ||
          idClean.includes(query.toLowerCase()) ||
          nameClean.includes(query.toLowerCase())
        );
      });

      // Combine matches with rich contract details
      const localMatches = [];
      matchingContracts.forEach((c) => {
        const rName = (retailers || []).find((r) => r.id === c.retailerId)?.businessName || c.retailerName || 'Partner Store';
        localMatches.push({
          type: 'CONTRACT',
          contractId: c.contractId,
          customerName: c.customerName,
          customerCnic: c.customerCnic || 'N/A',
          customerPhone: c.customerPhone || 'N/A',
          assetCategory: c.assetCategory || 'MOBILE_PHONE',
          deviceModel: c.deviceModel || 'Device',
          serialNumber: c.serialNumber || 'N/A',
          status: c.status || 'ACTIVE',
          retailerId: c.retailerId,
          retailerName: rName,
          retailerCity: 'Pakistan',
          totalPrice: c.totalPrice || 0,
          downPayment: c.downPayment || 0,
          monthlyInstallment: c.monthlyInstallment || 0,
          remainingBalance: c.remainingBalance || 0,
          paidMonths: c.paidMonths || 0,
          totalMonths: c.totalMonths || 10,
          nextDueDate: c.nextDueDate || 'N/A',
          contractImageUrl: c.contractImageUrl || null,
          cnicImageUrl: c.cnicImageUrl || null,
          notes: c.notes || '',
          createdAt: c.createdAt,
        });
      });

      matchingDevices.forEach((d) => {
        if (!localMatches.some((m) => m.contractId === d.contractId || m.serialNumber === d.imei)) {
          const rName = (retailers || []).find((r) => r.id === d.retailerId)?.businessName || d.retailerName || 'Partner Store';
          localMatches.push({
            type: 'DEVICE',
            contractId: d.contractId || `CTR-DEV-${d.deviceId}`,
            customerName: d.customerName || 'Customer',
            customerCnic: d.customerCnic || 'N/A',
            customerPhone: d.customerPhone || 'N/A',
            assetCategory: d.assetCategory || 'MOBILE_PHONE',
            deviceModel: `${d.brand || ''} ${d.model || ''}`,
            serialNumber: d.imei || 'N/A',
            status: d.deviceStatus || 'ACTIVE',
            retailerId: d.retailerId,
            retailerName: rName,
            retailerCity: 'Pakistan',
            totalPrice: d.totalPrice || 0,
            downPayment: d.downPayment || 0,
            monthlyInstallment: d.monthlyInstallment || 0,
            remainingBalance: d.remainingBalance || 0,
            paidMonths: d.paidMonths || 0,
            totalMonths: d.totalMonths || 10,
            nextDueDate: d.nextDueDate || 'N/A',
            contractImageUrl: d.contractImageUrl || null,
            cnicImageUrl: d.cnicImageUrl || null,
            notes: d.notes || '',
            createdAt: d.createdAt,
          });
        }
      });

      // If backend defaulter report has matches, merge them with local matches
      const combinedMatches = [...localMatches];
      if (defaulterRes && defaulterRes.matches && defaulterRes.matches.length > 0) {
        defaulterRes.matches.forEach((m) => {
          if (!combinedMatches.some((cm) => cm.contractId === m.contractId || cm.serialNumber === m.serialNumber)) {
            combinedMatches.push(m);
          }
        });
      }

      const isDefaulter = combinedMatches.some(
        (m) => m.status === 'RESTRICTED' || m.status === 'OVERDUE' || m.status === 'DEFAULTER'
      );

      // Compute Credit Score & Paid Months
      let score = 720;
      let totalPaidMonths = 0;
      let overdueCount = 0;
      let defaultedCount = 0;

      combinedMatches.forEach((m) => {
        totalPaidMonths += m.paidMonths || 0;
        if (m.status === 'RESTRICTED' || m.status === 'DEFAULTER') {
          defaultedCount += 1;
        } else if (m.status === 'OVERDUE') {
          overdueCount += 1;
        }
      });

      score -= overdueCount * 65;
      score -= defaultedCount * 220;
      score = Math.max(300, Math.min(850, score));

      let riskLevel = 'GOOD';
      let recommendation = 'Approved for financing with standard down payment.';

      if (isDefaulter || defaultedCount > 0 || score < 520) {
        riskLevel = 'DEFAULTER';
        recommendation = 'HIGH RISK DEFAULTER: Active restricted or defaulted record detected in network!';
      } else if (overdueCount > 0 || score < 640) {
        riskLevel = 'HIGH_RISK';
        recommendation = 'MODERATE RISK: Past overdue history detected. Verify guarantor details.';
      } else if (score >= 750) {
        riskLevel = 'EXCELLENT';
        recommendation = 'EXCELLENT CUSTOMER: Verified clean repayment track record across stores.';
      }

      const finalCreditReport = creditRes || {
        cnic: query,
        phone: query,
        creditScore: score,
        riskLevel,
        recommendation,
        totalContractsCount: combinedMatches.length,
        activeContractsCount: combinedMatches.filter((m) => m.status === 'ACTIVE').length,
        defaultedContractsCount: defaultedCount,
        totalPaidMonths,
      };

      const finalDefaulterReport = {
        isDefaulter,
        totalMatches: combinedMatches.length,
        matches: combinedMatches,
      };

      setCreditReport(finalCreditReport);
      setDefaulterReport(finalDefaulterReport);
    } catch (err) {
      console.error('Credit search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (!score || score < 550) return '#ef4444'; // Red
    if (score < 680) return '#f59e0b'; // Amber
    if (score < 750) return '#2563eb'; // Blue
    return '#10b981'; // Green
  };

  const getRiskBadge = (riskLevel) => {
    switch (riskLevel) {
      case 'DEFAULTER':
        return <span className="px-3 py-1 bg-rose-50 text-rose-700 font-bold rounded-full border border-rose-200 flex items-center gap-1 text-xs"><ShieldAlert className="w-4 h-4 text-rose-600" /> DEFAULTER DETECTED</span>;
      case 'HIGH_RISK':
        return <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold rounded-full border border-amber-200 flex items-center gap-1 text-xs"><AlertTriangle className="w-4 h-4 text-amber-600" /> HIGH RISK</span>;
      case 'EXCELLENT':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200 flex items-center gap-1 text-xs"><Award className="w-4 h-4 text-emerald-600" /> EXCELLENT SCORE</span>;
      default:
        return <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-full border border-blue-200 flex items-center gap-1 text-xs"><ShieldCheck className="w-4 h-4 text-blue-600" /> LOW RISK / GOOD</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Light Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">Cross-Store Credit & Defaulter Check</h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Search customer CNIC, Phone Number, IMEI, or Serial Number to verify repayment history and credit score across Pakistan’s retailer network.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700">
          <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
          Real-Time Network Sync Active
        </div>
      </div>

      {/* Light Search Bar */}
      <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter CNIC (e.g. 42101-0000000-1), Mobile # (+92 300 1234567), or IMEI/Serial #"
            className="w-full pl-12 pr-36 py-3.5 bg-white border-2 border-slate-300 focus:border-amber-400 text-slate-900 rounded-2xl shadow-sm text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-400/20 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer text-xs"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify Credit'}
          </button>
        </div>
      </form>

      {/* Initial Empty State - Light Cards */}
      {!searched && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl text-center space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Cross-Store Defaulter Scan</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Detects if a customer has defaulted on installment contracts at other electronics or mobile stores before finalizing a sale.
            </p>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl text-center space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto border border-emerald-200">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Dynamic 300–850 Credit Score</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Calculates behavioral score based on past on-time monthly installment payments, active contracts, and default alerts.
            </p>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl text-center space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Instant Fraud Alert Broadcast</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Scanning a defaulted device IMEI or CNIC immediately triggers a P2P notification to the original store retailer.
            </p>
          </div>
        </div>
      )}

      {/* Search Results - Light Cards */}
      {searched && (
        <div className="space-y-6">
          {/* Defaulter Alert Banner if flagged */}
          {defaulterReport?.isDefaulter && (
            <div className="p-6 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 flex items-start gap-4 shadow-sm">
              <ShieldAlert className="w-7 h-7 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-rose-900">DEFAULTER / RESTRICTED RECORD DETECTED!</h2>
                <p className="text-xs text-rose-700">
                  This CNIC/IMEI matches an active defaulted contract or restricted device registered in the retailer network. Exercise extreme caution.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Credit Score Gauge Card - Light Mode */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 flex flex-col items-center text-center justify-center relative shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Credit Score</span>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {getRiskBadge(creditReport?.riskLevel || 'GOOD')}
                </div>
              </div>

              {/* Meter Gauge */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    strokeWidth="3.5"
                    strokeDasharray={`${((creditReport?.creditScore || 720) - 300) / 5.5}, 100`}
                    strokeLinecap="round"
                    stroke={getScoreColor(creditReport?.creditScore)}
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-extrabold tracking-tight font-display" style={{ color: getScoreColor(creditReport?.creditScore) }}>
                    {creditReport?.creditScore || 720}
                  </span>
                  <span className="text-xs text-slate-400 font-bold mt-0.5">Range: 300 - 850</span>
                </div>
              </div>

              {/* Recommendation Banner */}
              <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold text-center">
                {creditReport?.recommendation || 'Verified customer record. Standard approval recommended.'}
              </div>
            </div>

            {/* Score Breakdown Metrics & Detailed Matching Contracts List */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-display">
                <FileText className="w-5 h-5 text-slate-700" />
                Customer Behavioral History
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold">Total Contracts</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1 font-display">{creditReport?.totalContractsCount || 0}</p>
                </div>
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                  <span className="text-xs text-emerald-700 font-bold">Active Contracts</span>
                  <p className="text-2xl font-extrabold text-emerald-700 mt-1 font-display">{creditReport?.activeContractsCount || 0}</p>
                </div>
                <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200">
                  <span className="text-xs text-rose-700 font-bold">Defaulted Contracts</span>
                  <p className="text-2xl font-extrabold text-rose-700 mt-1 font-display">{creditReport?.defaultedContractsCount || 0}</p>
                </div>
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                  <span className="text-xs text-amber-800 font-bold">Paid Installments</span>
                  <p className="text-2xl font-extrabold text-amber-900 mt-1 font-display">{creditReport?.totalPaidMonths || 0} Months</p>
                </div>
              </div>

              {/* Matching Contracts Detailed Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Cross-Store Contract Records ({defaulterReport?.totalMatches || 0})
                  </h3>
                </div>

                {defaulterReport?.matches?.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {defaulterReport.matches.map((match, idx) => (
                      <div
                        key={idx}
                        className="p-5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl space-y-4 transition-all"
                      >
                        {/* Header Line */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                          <div className="flex items-center gap-2">
                            {getAssetIcon(match.assetCategory)}
                            <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              {match.contractId}
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm">{match.deviceModel}</span>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                              match.status === 'RESTRICTED' || match.status === 'DEFAULTER' || match.status === 'OVERDUE'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : match.remainingBalance <= 0 || match.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {match.status === 'RESTRICTED' || match.status === 'DEFAULTER' || match.status === 'OVERDUE'
                              ? '⚠️ OVERDUE / DEFAULTER'
                              : match.remainingBalance <= 0 || match.status === 'COMPLETED'
                              ? '✅ FULLY PAID'
                              : '⏳ ACTIVE INSTALLMENT'}
                          </span>
                        </div>

                        {/* Customer & Store Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 font-bold block text-[11px]">CUSTOMER DETAILS</span>
                            <span className="font-bold text-slate-900 block mt-0.5">{match.customerName}</span>
                            <span className="text-slate-500 font-mono block mt-0.5">CNIC: {match.customerCnic}</span>
                            <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" /> {match.customerPhone}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 font-bold block text-[11px]">STORE / RETAILER</span>
                            <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                              {match.retailerName}
                            </span>
                            <span className="text-slate-500 font-mono block mt-0.5">Store ID: {match.retailerId || 'RET-101'}</span>
                            <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" /> {match.retailerCity || 'Pakistan'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 font-bold block text-[11px]">ASSET / SERIAL #</span>
                            <span className="font-bold text-slate-800 block mt-0.5">{match.assetCategory || 'MOBILE_PHONE'}</span>
                            <span className="text-slate-500 font-mono block mt-0.5">S/N: {match.serialNumber || 'N/A'}</span>
                            {match.nextDueDate && match.nextDueDate !== 'N/A' && (
                              <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3 text-slate-400" /> Next Due: {match.nextDueDate}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Financial Ledger Details */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium block text-[11px]">Total Price</span>
                            <span className="font-bold text-slate-900 font-mono mt-0.5 block">
                              Rs. {(match.totalPrice || 0).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block text-[11px]">Monthly Installment</span>
                            <span className="font-bold text-slate-900 font-mono mt-0.5 block">
                              Rs. {(match.monthlyInstallment || 0).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block text-[11px]">Installment Progress</span>
                            <span className="font-bold text-slate-800 mt-0.5 block">
                              {match.paidMonths || 0} / {match.totalMonths || 10} Mos
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block text-[11px]">Remaining Balance</span>
                            <span className="font-extrabold text-emerald-700 font-mono text-sm mt-0.5 block">
                              Rs. {(match.remainingBalance || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Footer Actions & Document Upload Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-2">
                            {match.contractImageUrl && (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                <ImageIcon className="w-3 h-3" /> Signed Contract Pic
                              </span>
                            )}
                            {match.cnicImageUrl && (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                                <ImageIcon className="w-3 h-3" /> CNIC Pic
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => navigate(`/contracts/${match.contractId}`)}
                            className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5 font-bold hover:bg-slate-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" /> View Contract Details <ExternalLink className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
                    No cross-store default matches found for this query. Clean record!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
