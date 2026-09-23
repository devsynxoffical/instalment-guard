import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import {
  FileText,
  Search,
  CreditCard,
  Calendar,
  PlusCircle,
  ChevronRight,
  Send,
  Clock,
  Building2,
  Tv,
  Laptop,
  Smartphone,
  Wind,
  Bike,
  Package,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { TableSkeleton } from '../components/SkeletonLoader';
import { deviceService } from '../services/deviceService';

export const ContractsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { contracts, retailers, loading, activeRetailer, activeRetailerId, sendCustomerReminder, extendCustomerDueDate, createApplianceContract } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // New Appliance Modal State
  const [showApplianceModal, setShowApplianceModal] = useState(false);
  const [applianceForm, setApplianceForm] = useState({
    customerName: '',
    customerCnic: '',
    customerPhone: '',
    assetCategory: 'SMART_TV',
    deviceModel: '',
    serialNumber: '',
    totalPrice: '',
    downPayment: '',
    monthlyInstallment: '',
    totalMonths: '10',
    contractImageUrl: '',
    cnicImageUrl: '',
  });

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

  const handleCreateApplianceContract = async (e) => {
    e.preventDefault();
    if (!applianceForm.customerName || !applianceForm.customerCnic || !applianceForm.deviceModel) {
      showToast('Please fill in customer name, CNIC, and model name.', 'error');
      return;
    }

    try {
      const targetRetailerId =
        activeRetailerId && activeRetailerId !== 'SUPER_ADMIN'
          ? activeRetailerId
          : (activeRetailer?.id || 'RET-101');

      const payload = {
        ...applianceForm,
        retailerId: targetRetailerId,
        totalPrice: parseFloat(applianceForm.totalPrice) || 50000,
        downPayment: parseFloat(applianceForm.downPayment) || 10000,
        monthlyInstallment: parseFloat(applianceForm.monthlyInstallment) || 4000,
        totalMonths: parseInt(applianceForm.totalMonths) || 10,
      };

      if (createApplianceContract) {
        await createApplianceContract(payload);
      } else {
        await deviceService.createContract(payload);
      }

      showToast('✅ Appliance Installment Contract created successfully!', 'success');
      setShowApplianceModal(false);
      setApplianceForm({
        customerName: '',
        customerCnic: '',
        customerPhone: '',
        assetCategory: 'SMART_TV',
        deviceModel: '',
        serialNumber: '',
        totalPrice: '',
        downPayment: '',
        monthlyInstallment: '',
        totalMonths: '10',
        contractImageUrl: '',
        cnicImageUrl: '',
      });
    } catch (err) {
      showToast(err.message || 'Failed to create contract', 'error');
    }
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setApplianceForm((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendReminder = async (e, contractId) => {
    e.stopPropagation();
    const res = await sendCustomerReminder(contractId);
    if (res.success) {
      showToast(`📲 Reminder sent to ${res.customerName} (${res.customerPhone})`, 'success');
    }
  };

  const handleExtendDueDate = async (e, contractId) => {
    e.stopPropagation();
    const res = await extendCustomerDueDate(contractId, 7);
    if (res.success) {
      showToast(`⏳ Granted 7-day extension to ${res.customerName}! New due date: ${res.newDueDate}`, 'success');
    }
  };

  const filteredContracts = contracts.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.contractId.toLowerCase().includes(term) ||
      (c.customerName && c.customerName.toLowerCase().includes(term)) ||
      (c.customerPhone && c.customerPhone.toLowerCase().includes(term)) ||
      (c.customerCnic && c.customerCnic.toLowerCase().includes(term)) ||
      (c.deviceModel && c.deviceModel.toLowerCase().includes(term)) ||
      (c.serialNumber && c.serialNumber.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesCategory =
      categoryFilter === 'ALL' ||
      (c.assetCategory || 'MOBILE_PHONE') === categoryFilter ||
      (categoryFilter === 'AIR_CONDITIONER' && c.assetCategory === 'REFRIGERATOR');

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[{ label: 'Contracts' }]}
        title="Finance & Installment Contracts Ledger"
        description="Manage customer installment plans, multi-appliance finance records, agreements, and contract document pictures"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowApplianceModal(true)}
              className="btn-primary bg-indigo-600 hover:bg-indigo-500"
            >
              <PlusCircle className="w-5 h-5" /> Add Appliance Contract
            </button>
            <button
              onClick={() => navigate('/payments/new')}
              className="btn-secondary"
            >
              <CreditCard className="w-5 h-5" /> Record Payment
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="teal-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search by contract ID, customer, CNIC, model, serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field cursor-pointer text-xs"
          >
            <option value="ALL">All Asset Categories</option>
            <option value="MOBILE_PHONE">📱 Mobile Phones</option>
            <option value="SMART_TV">📺 Smart TVs</option>
            <option value="LAPTOP">💻 Laptops</option>
            <option value="AIR_CONDITIONER">❄️ Air Conditioners</option>
            <option value="REFRIGERATOR">🧊 Refrigerators</option>
            <option value="MOTORBIKE">🏍️ Motorbikes</option>
            <option value="OTHER_APPLIANCE">📦 Other Appliances</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field cursor-pointer text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="RESTRICTED">OVERDUE / RESTRICTED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {/* Contracts Table */}
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
                  <th className="px-6 py-4">Category & Model</th>
                  <th className="px-6 py-4">Customer Info</th>
                  <th className="px-6 py-4">Doc Photo</th>
                  <th className="px-6 py-4">Store (Retailer)</th>
                  <th className="px-6 py-4">Monthly Plan</th>
                  <th className="px-6 py-4">Remaining Balance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredContracts.length > 0 ? (
                  filteredContracts.map((c) => {
                    const storeName = (retailers || []).find((r) => r.id === c.retailerId)?.businessName || c.retailerName || 'Partner Store';

                    return (
                      <tr
                        key={c.contractId}
                        onClick={() => navigate(`/contracts/${c.contractId}`)}
                        className="hover:bg-teal-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono text-xs text-teal-700 font-bold flex items-center gap-1.5">
                            {getAssetIcon(c.assetCategory)}
                            {c.contractId}
                          </div>
                          <div className="font-semibold text-slate-900 text-xs mt-1">{c.deviceModel}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">S/N: {c.serialNumber || 'N/A'}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{c.customerName}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">CNIC: {c.customerCnic}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{c.customerPhone}</div>
                        </td>

                        {/* Contract Image Document Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {c.contractImageUrl ? (
                            <div className="flex items-center gap-1 text-emerald-700 font-medium text-xs bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                              <ImageIcon className="w-3.5 h-3.5" /> Uploaded
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No Pic</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span>{storeName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {c.retailerId || 'RET-101'}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 font-mono">
                            Rs. {(c.monthlyInstallment || 0).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Paid: {c.paidMonths || 0} / {c.totalMonths || 10} mos
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-emerald-700 font-mono text-base">
                            Rs. {(c.remainingBalance || 0).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Total: Rs. {(c.totalPrice || 0).toLocaleString()}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                              c.remainingBalance <= 0 || c.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : c.status === 'RESTRICTED' || c.status === 'OVERDUE'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {c.remainingBalance <= 0 || c.status === 'COMPLETED'
                              ? '✅ PAID (FULL)'
                              : c.status === 'RESTRICTED' || c.status === 'OVERDUE'
                              ? '⚠️ OVERDUE'
                              : '⏳ PENDING'}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/payments/new?contractId=${c.contractId}`);
                              }}
                              className="btn-primary py-1.5 px-2.5 text-xs flex items-center gap-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Pay
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                      No installment contracts found matching search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Appliance Contract Modal */}
      {showApplianceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-indigo-400" /> New Appliance Installment Contract
              </h2>
              <button
                onClick={() => setShowApplianceModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateApplianceContract} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={applianceForm.customerName}
                    onChange={(e) => setApplianceForm({ ...applianceForm, customerName: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Muhammad Ali"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Customer CNIC Number *</label>
                  <input
                    type="text"
                    required
                    value={applianceForm.customerCnic}
                    onChange={(e) => setApplianceForm({ ...applianceForm, customerCnic: e.target.value })}
                    className="input-field font-mono"
                    placeholder="42101-0000000-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Customer Phone Number</label>
                  <input
                    type="text"
                    value={applianceForm.customerPhone}
                    onChange={(e) => setApplianceForm({ ...applianceForm, customerPhone: e.target.value })}
                    className="input-field"
                    placeholder="+92 300 1234567"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Asset / Appliance Category *</label>
                  <select
                    value={applianceForm.assetCategory}
                    onChange={(e) => setApplianceForm({ ...applianceForm, assetCategory: e.target.value })}
                    className="input-field"
                  >
                    <option value="SMART_TV">📺 Smart LED TV</option>
                    <option value="LAPTOP">💻 Laptop / PC</option>
                    <option value="AIR_CONDITIONER">❄️ Air Conditioner</option>
                    <option value="REFRIGERATOR">🧊 Refrigerator / Freezer</option>
                    <option value="MOTORBIKE">🏍️ Motorbike / Scooter</option>
                    <option value="MOBILE_PHONE">📱 Mobile Phone</option>
                    <option value="OTHER_APPLIANCE">📦 Other Home Appliance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Model Name / Description *</label>
                  <input
                    type="text"
                    required
                    value={applianceForm.deviceModel}
                    onChange={(e) => setApplianceForm({ ...applianceForm, deviceModel: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Samsung 55 Inch 4K Smart TV"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Serial Number / Frame #</label>
                  <input
                    type="text"
                    value={applianceForm.serialNumber}
                    onChange={(e) => setApplianceForm({ ...applianceForm, serialNumber: e.target.value })}
                    className="input-field font-mono"
                    placeholder="SN-9988223311"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Total Price (Rs) *</label>
                  <input
                    type="number"
                    required
                    value={applianceForm.totalPrice}
                    onChange={(e) => setApplianceForm({ ...applianceForm, totalPrice: e.target.value })}
                    className="input-field font-mono"
                    placeholder="80000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Down Payment (Rs)</label>
                  <input
                    type="number"
                    value={applianceForm.downPayment}
                    onChange={(e) => setApplianceForm({ ...applianceForm, downPayment: e.target.value })}
                    className="input-field font-mono"
                    placeholder="20000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Monthly Installment (Rs)</label>
                  <input
                    type="number"
                    value={applianceForm.monthlyInstallment}
                    onChange={(e) => setApplianceForm({ ...applianceForm, monthlyInstallment: e.target.value })}
                    className="input-field font-mono"
                    placeholder="6000"
                  />
                </div>
              </div>

              {/* Physical Signed Contract Picture & CNIC Upload */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-200 block">Signed Contract & CNIC Document Photo Upload</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Physical Signed Agreement Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'contractImageUrl')}
                      className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-semibold hover:file:bg-indigo-500 cursor-pointer"
                    />
                    {applianceForm.contractImageUrl && (
                      <img src={applianceForm.contractImageUrl} alt="Contract Preview" className="h-20 w-auto rounded-lg border border-slate-700 mt-2 object-cover" />
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Customer CNIC Card Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'cnicImageUrl')}
                      className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-semibold hover:file:bg-indigo-500 cursor-pointer"
                    />
                    {applianceForm.cnicImageUrl && (
                      <img src={applianceForm.cnicImageUrl} alt="CNIC Preview" className="h-20 w-auto rounded-lg border border-slate-700 mt-2 object-cover" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApplianceModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-indigo-600 hover:bg-indigo-500 text-xs px-6"
                >
                  Save Installment Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
