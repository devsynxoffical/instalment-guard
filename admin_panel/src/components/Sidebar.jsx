import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Smartphone,
  FileText,
  Building2,
  CreditCard,
  ShieldCheck,
  UserCheck,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

export const Sidebar = ({ sidebarState = 'EXPANDED', setSidebarState }) => {
  const { role } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isCollapsed = sidebarState === 'COLLAPSED';
  const isClosed = sidebarState === 'CLOSED';

  const superAdminNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/credit-check', label: 'Credit & Defaulter Check', icon: UserCheck },
    { path: '/devices', label: 'Devices Control', icon: Smartphone },
    { path: '/contracts', label: 'Finance & Contracts', icon: FileText },
    { path: '/retailers', label: 'Retailers Directory', icon: Building2 },
    { path: '/payments', label: 'Payments Ledger', icon: CreditCard },
    { path: '/audit-logs', label: 'Security Audit Logs', icon: ShieldCheck },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/profile', label: 'My Profile', icon: User },
  ];

  const retailerNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/credit-check', label: 'Credit & Defaulter Check', icon: UserCheck },
    { path: '/devices', label: 'My Enrolled Devices', icon: Smartphone },
    { path: '/contracts', label: 'Finance & Contracts', icon: FileText },
    { path: '/payments', label: 'Customer Payments', icon: CreditCard },
    { path: '/audit-logs', label: 'My Activity Trail', icon: ShieldCheck },
    { path: '/profile', label: 'My Profile', icon: User },
  ];

  const navItems = role === 'SUPER_ADMIN' ? superAdminNavItems : retailerNavItems;

  const getSidebarWidthClass = () => {
    if (isClosed) return 'w-0 opacity-0 pointer-events-none border-0 overflow-hidden -translate-x-full md:-translate-x-full';
    if (isCollapsed) return 'w-20 translate-x-0';
    return 'w-64 translate-x-0';
  };

  return (
    <>
      {/* Mobile Floating Menu Toggle */}
      <button
        onClick={() => setMobileDrawerOpen(true)}
        className="md:hidden fixed bottom-5 left-5 z-40 p-3 rounded-full bg-slate-900 text-amber-400 shadow-xl border border-slate-700 hover:bg-slate-800 transition-all"
        title="Open Sidebar Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay Backdrop */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
        ></div>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col justify-between shadow-sm shrink-0 ${getSidebarWidthClass()} ${
          mobileDrawerOpen ? 'translate-x-0 w-64 opacity-100 pointer-events-auto' : ''
        }`}
      >
        {/* Top Header & Branding */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between px-2 py-2 mb-1">
            {!isCollapsed ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-900 text-amber-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-extrabold text-sm text-slate-900 tracking-tight font-display truncate">
                      Installment Guard
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black tracking-wider">
                      PRO
                    </span>
                  </div>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={() => {
                    if (setSidebarState) setSidebarState('CLOSED');
                    setMobileDrawerOpen(false);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Close Sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mx-auto flex flex-col items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-900 text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            )}
          </div>

          {/* Navigation items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md shadow-amber-400/20 scale-[1.01]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                    }`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Collapse / Close Controls */}
        <div className="p-3 border-t border-slate-200 flex flex-col gap-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1">
              <span>v2.4 Pro Admin</span>
              <span className="text-emerald-600">● Online</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            {/* Toggle Collapse Mode Button */}
            <button
              onClick={() => {
                if (setSidebarState) {
                  setSidebarState(isCollapsed ? 'EXPANDED' : 'COLLAPSED');
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!isCollapsed && <span>Collapse</span>}
            </button>

            {/* Completely Close / Hide Button */}
            {!isCollapsed && (
              <button
                onClick={() => {
                  if (setSidebarState) setSidebarState('CLOSED');
                  setMobileDrawerOpen(false);
                }}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors"
                title="Hide Sidebar Completely"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
