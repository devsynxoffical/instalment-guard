import React, { useState, useEffect } from 'react';
import { QrCode, Download, Copy, Check, X, Smartphone, ShieldCheck, Wifi, ExternalLink, RefreshCw, Building2 } from 'lucide-react';
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

  const retailerQuery = effectiveRetailerId ? `?retailerId=${encodeURIComponent(effectiveRetailerId)}` : '';
  const apkUrl = `${baseUrl.replace(/\/+$/, '')}/download/installment_guard.apk${retailerQuery}`;

  // Android Enterprise Zero-Touch Device Owner Provisioning Payload
  const dpcProvisioningPayload = JSON.stringify({
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.example.installment_guard/com.example.installment_guard.device.InstallmentAdminReceiver",
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": apkUrl,
    "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
    "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
      "retailerId": effectiveRetailerId || "RET-101",
      "serverUrl": `${baseUrl.replace(/\/+$/, '')}/api`
    }
  });

  const activeQrText = qrMode === 'direct' ? apkUrl : dpcProvisioningPayload;
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
    navigator.clipboard.writeText(apkUrl);
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
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl shadow-amber-950/20 text-slate-100 transition-all">
        
        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Installment Guard Mobile App
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black tracking-wide shadow-xs">
                  v1.0.0 PRO APK
                </span>
              </h2>
              <p className="text-xs text-slate-400">Scan QR Code to download or setup Device Owner on customer phones</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
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
            className={`px-4 py-2.5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'guide'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Setup & Provisioning Guide
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {activeTab === 'qr' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* QR Mode Switcher */}
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

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-5 bg-slate-950/60 rounded-2xl border border-slate-800 shadow-inner">
                <div 
                  className="p-3 bg-white rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300 cursor-pointer flex items-center justify-center min-w-[240px] min-h-[240px]"
                  title={qrMode === 'direct' ? "Scan with standard phone camera to download APK" : "Scan during Android 6-taps Welcome screen"}
                >
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Installment Guard APK Download QR" 
                      className="w-[230px] h-[230px] object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-[230px] h-[230px] flex items-center justify-center text-slate-400 text-xs">
                      Generating standard QR Code...
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-400 mt-3 flex items-center gap-1.5 text-center">
                  <Wifi className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {qrMode === 'direct' 
                    ? 'Scan with standard Phone Camera or QR app to download APK' 
                    : 'Scan with Android 6-Taps Provisioning Reader (Reset Screen)'}
                </p>
              </div>

              {/* URL Customizer & Direct Buttons */}
              <div className="space-y-4">
                {effectiveRetailerId && (
                  <div className="p-3 rounded-2xl bg-teal-950/80 border border-teal-500/40 flex items-center justify-between text-xs shadow-inner">
                    <div className="flex items-center gap-2 text-teal-300 font-bold">
                      <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <div>
                        <div>{retailerName}</div>
                        <div className="text-[10px] text-teal-400/80 font-normal">Devices will auto-bind to your store dashboard</div>
                      </div>
                    </div>
                    <span className="font-mono px-2.5 py-1 rounded-lg bg-teal-900/90 border border-teal-700/50 text-teal-200 text-xs font-black tracking-wider">
                      {effectiveRetailerId}
                    </span>
                  </div>
                )}

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
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400 transition-colors font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Points to live cloud backend. Mobile app automatically checks in with this server.
                  </p>
                </div>

                {/* Full Download URL Display */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Direct APK Download URL
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                    <input
                      type="text"
                      readOnly
                      value={apkUrl}
                      className="flex-1 bg-transparent text-xs font-mono text-amber-400 outline-none px-2 truncate"
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
                    href={apkUrl}
                    download="installment_guard.apk"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4 text-slate-950" />
                    Download APK File Direct (18.4 MB)
                  </a>

                  <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                    <span>Android 8.0 to 14.0 Supported</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" /> Anti-Tamper MDM Ready
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
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Installment Guard MDM Engine v1.0.0</span>
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
