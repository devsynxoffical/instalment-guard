import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { FileText, User, Smartphone, CreditCard, Calendar, Image as ImageIcon, ZoomIn, X, Building2, Package } from 'lucide-react';

export const ContractDetailPage = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { contracts, payments, retailers } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);

  const contract = contracts.find((c) => c.contractId === contractId) || contracts[0];
  const contractPayments = payments.filter((p) => p.contractId === contractId);

  if (!contract) {
    return (
      <div className="page-container py-12 text-center text-slate-500">
        Contract not found.{' '}
        <button onClick={() => navigate('/contracts')} className="text-teal-700 font-bold underline">
          Back to Contracts
        </button>
      </div>
    );
  }

  const storeName = (retailers || []).find((r) => r.id === contract.retailerId)?.businessName || 'Partner Store';

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[{ label: 'Contracts', path: '/contracts' }, { label: contract.contractId }]}
        title={`Contract Ledger: ${contract.contractId}`}
        description={`Customer: ${contract.customerName} • Asset: ${contract.deviceModel}`}
        action={
          contract.remainingBalance > 0 ? (
            <button
              onClick={() => navigate(`/payments/new?contractId=${contract.contractId}`)}
              className="btn-primary"
            >
              <CreditCard className="w-5 h-5" /> Record Payment
            </button>
          ) : (
            <span className="badge badge-success text-sm py-2 px-4">FULLY PAID</span>
          )
        }
      />

      {/* Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Details */}
        <div className="teal-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
            <User className="w-4 h-4 text-teal-700" /> Customer Information
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Full Name</span>
              <span className="text-slate-900 font-bold">{contract.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone Number</span>
              <span className="text-slate-900 font-mono">{contract.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CNIC Number</span>
              <span className="text-slate-900 font-mono">{contract.customerCnic}</span>
            </div>
          </div>
        </div>

        {/* Asset / Device Info */}
        <div className="teal-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
            <Package className="w-4 h-4 text-teal-700" /> Asset & Store Information
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Category</span>
              <span className="text-slate-900 font-bold">{contract.assetCategory || 'MOBILE_PHONE'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Asset Model</span>
              <span className="text-slate-900 font-bold">{contract.deviceModel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Serial / IMEI</span>
              <span className="text-slate-900 font-mono">{contract.serialNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Store / Retailer</span>
              <span className="text-teal-700 font-bold">{storeName}</span>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="teal-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
            <CreditCard className="w-4 h-4 text-teal-700" /> Financial Summary
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Contract Price</span>
              <span className="text-slate-900 font-mono font-bold">Rs. {(contract.totalPrice || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Down Payment</span>
              <span className="text-slate-900 font-mono">Rs. {(contract.downPayment || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Remaining Balance</span>
              <span className="text-emerald-700 font-mono font-bold text-sm">
                Rs. {(contract.remainingBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Documents & Photos */}
      <div className="teal-card p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-teal-700" /> Signed Agreement & CNIC Document Photos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">Physical Signed Contract Agreement</span>
            {contract.contractImageUrl ? (
              <div
                onClick={() => setSelectedImage(contract.contractImageUrl)}
                className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-300 bg-slate-900"
              >
                <img src={contract.contractImageUrl} alt="Contract Document" className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                  <ZoomIn className="w-5 h-5" /> Click to Enlarge
                </div>
              </div>
            ) : (
              <div className="h-48 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs italic">
                No physical contract photo uploaded yet
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">Customer CNIC Card Photo</span>
            {contract.cnicImageUrl ? (
              <div
                onClick={() => setSelectedImage(contract.cnicImageUrl)}
                className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-300 bg-slate-900"
              >
                <img src={contract.cnicImageUrl} alt="Customer CNIC" className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                  <ZoomIn className="w-5 h-5" /> Click to Enlarge
                </div>
              </div>
            ) : (
              <div className="h-48 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs italic">
                No CNIC card photo uploaded yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Receipts History */}
      <div className="teal-card p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-teal-700" /> Recorded Payment Receipts ({contractPayments.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Receipt ID & Date</th>
                <th className="px-6 py-3.5">Amount Paid</th>
                <th className="px-6 py-3.5">Method</th>
                <th className="px-6 py-3.5">Reference #</th>
                <th className="px-6 py-3.5">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {contractPayments.length > 0 ? (
                contractPayments.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-teal-700 font-bold">
                      {p.paymentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-700 font-mono">
                      Rs. {(p.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span className="badge badge-info">{p.method || 'Cash'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                      {p.reference || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {p.recordedBy || 'Admin'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400 text-xs">
                    No installment payment receipts recorded for this contract yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 text-white bg-slate-800 hover:bg-slate-700 rounded-full cursor-pointer z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={selectedImage} alt="Document Preview" className="max-h-[80vh] w-auto mx-auto rounded-lg object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
