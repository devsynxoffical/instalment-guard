import React, { useState, useEffect } from 'react';
import { QrCode, Download, Copy, Check, X, Smartphone, ShieldCheck, Wifi, ExternalLink, RefreshCw, Building2, Store } from 'lucide-react';
import { generateQRCodeDataUrl, generateQRCodeSVG } from '../utils/qrGenerator';
import { useAuth } from '../context/AuthContext';

export default function AppDownloadModal({ isOpen, onClose }) {
  const { currentUser, role, activeRetailer } = useAuth();

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const currentHost = typeof window !== 'undefined' ? window.location.host : 'instalment-guard-production-8ff6.up.railway.app';
  const defaultHost = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'instalment-guard-production-8ff6.up.railway.app'
    : currentHost;

  const [serverHost, setServerHost] = useState(defaultHost);
  const [selectedApk, setSelectedApk] = useState('guard'); // 'guard' | 'retailer'
  const [copied, setCopied] = useState(false);
  const [copiedAdb, setCopiedAdb] = useState(false);
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'guide'
  const [qrMode, setQrMode] = useState('direct'); // 'direct' | 'dpc'
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Retailer Scope
  const effectiveRetailerId = role === 'RETAILER'
    ? (currentUser?.retailerId || activeRetailer?.id || 'RET-101')
    : (currentUser?.retailerId && currentUser.retailerId !== 'SUPER_ADMIN' ? currentUser.retailerId : null);

  const retailerName = activeRetailer?.businessName || currentUser?.name || 'Retailer Store';

  // Construct URL with proper scheme & retailer binding
  const baseUrl = serverHost.startsWith('http://') || serverHost.startsWith('https://')
    ? serverHost
    : `${isHttps || serverHost.includes('railway.app') ? 'https://' : 'http://'}${serverHost}`;

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const retailerQuery = effectiveRetailerId ? `?retailerId=${encodeURIComponent(effectiveRetailerId)}` : '';
  
  const guardApkUrl = `${cleanBase}/download/installment_guard.apk${retailerQuery}`;
  const retailerApkUrl = `${cleanBase}/download/retailer_app.apk`;
  const currentApkUrl = selectedApk === 'guard' ? guardApkUrl : retailerApkUrl;

  // Android Enterprise Zero-Touch Device Owner Provisioning Payload (for Customer Guard)
  const dpcProvisioningPayload = JSON.stringify({
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.example.installment_guard/com.example.installment_guard.device.InstallmentAdminReceiver",
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": guardApkUrl,
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "PtPdqGxf8LVeElfVwNVi4SIMZ2thmrCwPOBFgQBqmeY",
    "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
    "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
      "retailerId": effectiveRetailerId || "RET-862",
      "serverUrl": `${cleanBase}/api`
    }
  });

  const activeQrText = selectedApk === 'retailer' 
    ? retailerApkUrl 
    : (qrMode === 'direct' ? guardApkUrl : dpcProvisioningPayload);
    
  const backendQrUrl = `/api/qr?text=${encodeURIComponent(activeQrText)}`;

  useEffect(() => {
    let isMounted = true;
    generateQRCodeDataUrl(activeQrText, {
      size: 320,
      bgColor: '#FFFFFF',
      fgColor: '#000000',
    }).then((url) => {
      if (isMounted) {
        setQrDataUrl(url || backendQrUrl);
      }
    }).catch(() => {
      if (isMounted) setQrDataUrl(backendQrUrl);
    });
    return () => { isMounted = false; };
  }, [activeQrText, backendQrUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentApkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const adbCommand = `adb shell dpm set-device-owner com.example.installment_guard/.device.InstallmentAdminReceiver`;

  const handleCopyAdb = () => {
    navigator.clipboard.writeText(adbCommand);
    setCopiedAdb(true);
    setTimeout(() => setCopiedAdb(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl shadow-teal-950/20 text-slate-100 transition-all max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="relative px-6 pt-5 pb-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${selectedApk === 'guard' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-teal-500/15 text-teal-400 border-teal-500/30'}`}>
              {selectedApk === 'guard' ? <Smartphone className="w-6 h-6" /> : <Store className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Download Mobile APKs
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black tracking-wide ${selectedApk === 'guard' ? 'bg-amber-400 text-slate-950' : 'bg-teal-400 text-slate-950'}`}>
                  {selectedApk === 'guard' ? 'CUSTOMER GUARD' : 'RETAILER APP'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Two dedicated Android APKs: One for customer devices, one for retailers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* APK Switcher Bar */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/70 border-b border-slate-800 gap-2 shrink-0 px-6">
          <button
            onClick={() => { setSelectedApk('guard'); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              selectedApk === 'guard'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>1. Customer Guard APK</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">Device Owner</span>
          </button>
          <button
            onClick={() => { setSelectedApk('retailer'); setActiveTab('qr'); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              selectedApk === 'retailer'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/50'
            }`}
          >
            <Store className="w-4 h-4 text-teal-400" />
            <span>2. Retailer App APK</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-400/20 text-teal-300">Shopkeeper</span>
          </button>
        </div>

        {/* Tab Switcher (Only needed for Guard APK, or for Guide) */}
        {selectedApk === 'guard' ? (
          <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 shrink-0">
            <button
              onClick={() => setActiveTab('qr')}
              className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'qr'
                  ? 'border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR Code & Download Link
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'guide'
                  ? 'border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Setup & Provisioning Guide
            </button>
          </div>
        ) : (
          <div className="px-6 py-2 bg-teal-950/30 border-b border-teal-900/40 text-xs text-teal-300 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5">
              <Store className="w-4 h-4 text-teal-400" /> Retailers use this app on their Android mobile to manage customers and lock devices.
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-900/60 text-teal-200 border border-teal-700/50">
              retailer_app.apk
            </span>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'qr' || selectedApk === 'retailer' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* QR Mode Switcher (only for Guard APK) */}
              {selectedApk === 'guard' ? (
                <div className="md:col-span-2 flex items-center justify-center gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setQrMode('direct')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      qrMode === 'direct'
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    Direct APK Download QR (Phone Camera)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrMode('dpc')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      qrMode === 'dpc'
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Zero-Touch DPC QR (6-Taps Setup)
                  </button>
                </div>
              ) : (
                <div className="md:col-span-2 p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-xs text-teal-200 flex items-center gap-2">
                  <Store className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <strong>Retailer App Installation:</strong> Retailers download this APK on their personal phone, log in with credentials you provide in the <em>Retailers</em> tab, and enroll customer phones directly from their counter.
                  </div>
                </div>
              )}

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-5 bg-slate-950/60 rounded-2xl border border-slate-800 shadow-inner">
                <div 
                  className="p-3 bg-white rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300 cursor-pointer flex items-center justify-center min-w-[220px] min-h-[220px]"
                  title="Scan with phone camera to download APK"
                >
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="APK Download QR" 
                      className="w-[210px] h-[210px] object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-[210px] h-[210px] flex items-center justify-center text-slate-400 text-xs">
                      Generating QR Code...
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-400 mt-3 flex items-center gap-1.5 text-center">
                  <Wifi className={`w-3.5 h-3.5 shrink-0 ${selectedApk === 'guard' ? 'text-amber-400' : 'text-teal-400'}`} />
                  {selectedApk === 'retailer' 
                    ? 'Scan with Retailer phone to download Retailer App'
                    : (qrMode === 'direct' 
                        ? 'Scan with customer camera to download Guard APK' 
                        : 'Scan with Android 6-Taps Provisioning Reader')}
                </p>
              </div>

              {/* URL Customizer & Direct Buttons */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Server Host / Cloud Domain
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={serverHost}
                      onChange={(e) => setServerHost(e.target.value)}
                      placeholder="e.g. instalment-guard-production-8ff6.up.railway.app"
                      className={`flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none transition-colors font-mono ${
                        selectedApk === 'guard' ? 'focus:border-amber-400' : 'focus:border-teal-400'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Points to live cloud backend. APK connects to this domain for commands & telemetry.
                  </p>
                </div>

                {/* Full Download URL Display */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {selectedApk === 'guard' ? 'Customer Guard APK URL' : 'Retailer App APK URL'}
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                    <input
                      type="text"
                      readOnly
                      value={currentApkUrl}
                      className={`flex-1 bg-transparent text-xs font-mono outline-none px-2 truncate ${
                        selectedApk === 'guard' ? 'text-amber-400' : 'text-teal-400'
                      }`}
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Copy URL"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 flex flex-col gap-2.5">
                  <a
                    href={currentApkUrl}
                    download={selectedApk === 'guard' ? 'installment_guard.apk' : 'retailer_app.apk'}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full py-3 px-4 font-black rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      selectedApk === 'guard'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-400/20'
                        : 'bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-slate-950 shadow-teal-400/20'
                    }`}
                  >
                    <Download className="w-4 h-4 text-slate-950" />
                    {selectedApk === 'guard' ? 'Download Guard APK (Customer Device)' : 'Download Retailer APK (Shopkeeper)'}
                  </a>

                  <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                    <span>Android 8.0 - 15.0</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {selectedApk === 'guard' ? 'Anti-Tamper MDM DPC' : 'Secure JWT Auth'}
                    </span>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Anti-Tamper Device Owner Provisioning Guide
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                    A
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-200">Method 1: Production Handover (6-Taps Zero-Touch Setup)</h4>
                    <p className="text-slate-400">
                      On new/factory reset phone: Tap <strong>6 times</strong> on blank space of the "Welcome / Start" screen. Scan the <strong>Anti-Tamper Device Owner QR</strong>. Android automatically sets the app as permanent Device Owner, completely locking out factory reset and uninstallation.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                    B
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="font-semibold text-slate-200">Method 2: Existing Phone (Without Factory Reset via ADB)</h4>
                    <p className="text-slate-400">
                      Install APK directly, enable USB debugging, and execute this 1-line command on PC/terminal:
                    </p>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-2 font-mono text-[11px] text-amber-300">
                      <span className="flex-1 select-all">{adbCommand}</span>
                      <button
                        onClick={handleCopyAdb}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        {copiedAdb ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedAdb ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2 mt-4">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Once Device Owner is active, Android OS permanently disables Factory Reset in Settings and greys out the Uninstall button.</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Dual APK Distribution: Customer Guard & Retailer Management</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

