import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  Search,
  Bell,
  Coins,
  LogOut,
  User,
  CheckCheck,
  ChevronDown,
  PlusCircle,
  Send,
  Clock,
  Lock,
  AlertTriangle,
  Settings,
  Menu,
  QrCode,
  Smartphone,
} from 'lucide-react';
import AppDownloadModal from './AppDownloadModal';

export const Navbar = ({ onOpenSearch, onToggleSidebar, sidebarState }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const {
    role,
    switchRole,
    retailers,
    activeRetailerId,
    setActiveRetailerId,
    activeRetailer,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    sendCustomerReminder,
    extendCustomerDueDate,
    dispatchCommand,
    logout,
  } = useAuth();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSendReminder = async (e, n) => {
    e.stopPropagation();
    if (!n.contractId) return;
    const res = await sendCustomerReminder(n.contractId);
    if (res.success) {
      showToast(`📲 Reminder sent to ${res.customerName} (${res.customerPhone})`, 'success');
      markNotificationRead(n.id);
    }
  };

  const handleExtendDueDate = async (e, n) => {
    e.stopPropagation();
    if (!n.contractId) return;
    const res = await extendCustomerDueDate(n.contractId, 7);
    if (res.success) {
      showToast(`⏳ Granted 7-day extension to ${res.customerName}! New due date: ${res.newDueDate}`, 'success');
      markNotificationRead(n.id);
    }
  };

  const handleLockDevice = async (e, n) => {
    e.stopPropagation();
    if (!n.deviceId) return;
    await dispatchCommand(n.deviceId, 'RESTRICT_DEVICE');
    showToast(`🔒 Lock command sent to customer device (${n.deviceId})`, 'warning');
    markNotificationRead(n.id);
  };

  const navTabs = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/credit-check', label: 'Credit Check' },
    { path: '/devices', label: 'Devices' },
    { path: '/contracts', label: 'Contracts' },
    { path: '/payments', label: 'Payments' },
    ...(role === 'SUPER_ADMIN'
      ? [
        { path: '/retailers', label: 'Retailers' },
        { path: '/settings', label: 'Settings' },
      ]
      : []),
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return { title: 'Dashboard' };
    if (path.startsWith('/credit-check')) return { title: 'Credit & Defaulter Check' };
    if (path.startsWith('/devices')) return { title: 'Devices Control' };
    if (path.startsWith('/contracts')) return { title: 'Finance & Contracts' };
    if (path.startsWith('/payments')) return { title: 'Payments Ledger' };
    if (path.startsWith('/retailers')) return { title: 'Retailers Directory' };
    if (path.startsWith('/audit-logs')) return { title: 'Security Audit Logs' };
    if (path.startsWith('/settings')) return { title: 'System Settings' };
    if (path.startsWith('/profile')) return { title: 'My Profile' };
    return { title: 'Dashboard' };
  };

  const pageInfo = getPageTitle();
  const isExpanded = sidebarState === 'EXPANDED';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 z-30 sticky top-0 shadow-xs shrink-0 w-full min-w-0 transition-all duration-300">
      {/* Left Header Title & Sidebar Toggle */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-amber-400 hover:text-slate-950 transition-all shadow-xs shrink-0 flex items-center justify-center"
          title="Toggle Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        <h1 className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 tracking-tight font-display whitespace-nowrap truncate max-w-[140px] sm:max-w-[240px] md:max-w-none">
          {pageInfo.title}
        </h1>
      </div>

      {/* Right Controls - Dynamically Auto-Adjusting Based on Sidebar State */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0 flex-nowrap">
        {/* Global Search Trigger */}
        <button
          onClick={onOpenSearch}
          className={`hidden ${isExpanded ? '2xl:flex' : 'xl:flex'} items-center gap-2 h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs hover:border-slate-300 hover:text-slate-900 transition-all w-32 lg:w-40 shadow-xs shrink-0`}
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">Search...</span>
          <span className="ml-auto text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">Ctrl+K</span>
        </button>

        {/* Mobile / Compact Search Button */}
        <button onClick={onOpenSearch} className={`${isExpanded ? '2xl:hidden' : 'xl:hidden'} h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-700 shrink-0`}>
          <Search className="w-4 h-4" />
        </button>

        {/* Role View Switcher - Super Admin Only */}
        {role === 'SUPER_ADMIN' ? (
          <div className="relative shrink-0">
            <select
              value={activeRetailerId || 'SUPER_ADMIN'}
              onChange={(e) => {
                setActiveRetailerId(e.target.value);
              }}
              className={`h-9 bg-slate-50 text-xs text-amber-900 font-bold px-2.5 rounded-xl border border-amber-300 cursor-pointer focus:outline-none shadow-xs hover:bg-amber-50 transition-colors ${
                isExpanded ? 'max-w-[110px] sm:max-w-[140px]' : 'max-w-[130px] sm:max-w-[160px]'
              } truncate shrink-0`}
            >
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ALL">All Stores</option>
              {retailers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.businessName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="h-9 flex items-center px-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-xs max-w-[120px] truncate shrink-0">
            {activeRetailer?.businessName || 'Store'}
          </div>
        )}

        {/* Credit Counter */}
        <div className="h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-amber-400 text-slate-950 text-xs font-black shadow-xs shrink-0 whitespace-nowrap">
          <Coins className="w-4 h-4 text-slate-950 shrink-0" />
          <span className={isExpanded ? 'hidden 2xl:inline' : 'hidden xl:inline'}>
            {activeRetailerId && activeRetailerId !== 'SUPER_ADMIN'
              ? `${activeRetailer?.credits || 0} Credits`
              : `${retailers.reduce((acc, r) => acc + (r.credits || 0), 0)} Distributed`}
          </span>
          <span className={isExpanded ? '2xl:hidden font-bold' : 'xl:hidden font-bold'}>
            {activeRetailerId && activeRetailerId !== 'SUPER_ADMIN'
              ? `${activeRetailer?.credits || 0} CR`
              : `${retailers.reduce((acc, r) => acc + (r.credits || 0), 0)} CR`}
          </span>
        </div>

        {/* Quick Enroll Button */}
        <button
          onClick={() => navigate('/devices/enroll')}
          className={`hidden ${isExpanded ? 'xl:flex' : 'md:flex'} items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold shadow-xs transition-all shrink-0 whitespace-nowrap`}
        >
          <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Enroll Device</span>
        </button>

        {/* QR Code App Download Button */}
        <button
          onClick={() => setIsQrModalOpen(true)}
          className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black shadow-xs shadow-amber-400/20 transition-all shrink-0 whitespace-nowrap active:scale-95"
          title="Scan QR Code to Download Mobile App"
        >
          <QrCode className="w-4 h-4 text-slate-950 shrink-0" />
          <span className={isExpanded ? 'hidden lg:inline' : 'hidden sm:inline'}>App QR Code</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 relative transition-colors shadow-xs shrink-0"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 z-50 animate-fade-in space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-teal-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">System Notifications</h3>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 font-semibold"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {notifications.length > 0 ? (
                  notifications.map((n) => {
                    const isOverdue = n.type === 'OVERDUE';
                    const isDueSoon = n.type === 'DUE_SOON';

                    return (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3 rounded-xl text-xs border transition-all space-y-2 ${isOverdue
                          ? 'bg-rose-50/70 border-rose-200 text-slate-900'
                          : isDueSoon
                            ? 'bg-amber-50/70 border-amber-200 text-slate-900'
                            : n.isRead
                              ? 'bg-slate-50 border-slate-100 text-slate-500'
                              : 'bg-teal-50/60 border-teal-100 text-slate-900 font-medium'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${isOverdue
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : isDueSoon
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-teal-100 text-teal-800 border-teal-300'
                              }`}
                          >
                            {isOverdue && <AlertTriangle className="w-3 h-3" />}
                            {isDueSoon && <Clock className="w-3 h-3" />}
                            {n.type || 'NOTICE'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 text-xs">{n.title}</div>
                          <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</div>
                        </div>

                        {/* Interactive Quick Actions for Overdue / Due Soon */}
                        {n.contractId && (
                          <div className="pt-1 flex items-center gap-1.5 flex-wrap border-t border-slate-200/60">
                            <button
                              onClick={(e) => handleSendReminder(e, n)}
                              className="px-2 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm"
                              title="Customer ko SMS/App reminder bhejo"
                            >
                              <Send className="w-3 h-3" /> Reminder Bhejo
                            </button>

                            <button
                              onClick={(e) => handleExtendDueDate(e, n)}
                              className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm"
                              title="Customer ko 7 days extension / allow karo"
                            >
                              <Clock className="w-3 h-3" /> Allow (+7 Days)
                            </button>

                            {n.deviceId && isOverdue && (
                              <button
                                onClick={(e) => handleLockDevice(e, n)}
                                className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm"
                                title="Device restriction lock enforce karo"
                              >
                                <Lock className="w-3 h-3" /> Lock Device
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">No notifications available</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="h-9 px-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <div className="w-6 h-6 rounded-lg bg-slate-900 text-amber-400 font-extrabold flex items-center justify-center text-[10px]">
              {role === 'SUPER_ADMIN' ? 'SA' : 'RET'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-fade-in space-y-1">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="font-semibold text-slate-900 text-xs">
                  {role === 'SUPER_ADMIN' ? 'Super Admin' : activeRetailer?.businessName || 'Retailer'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">{role}</div>
              </div>

              <Link
                to="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2 font-medium transition-colors"
              >
                <User className="w-4 h-4 text-slate-500" /> My Profile
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* App Download QR Code Modal */}
      <AppDownloadModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </header>
  );
};

export default Navbar;
