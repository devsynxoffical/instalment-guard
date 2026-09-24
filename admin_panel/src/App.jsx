import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

import { DashboardPage } from './pages/DashboardPage';
import { DevicesPage } from './pages/DevicesPage';
import { EnrollDevicePage } from './pages/EnrollDevicePage';
import { DeviceDetailPage } from './pages/DeviceDetailPage';

import { ContractsPage } from './pages/ContractsPage';
import { ContractDetailPage } from './pages/ContractDetailPage';
import { CreditCheckPage } from './pages/CreditCheckPage';

import { PaymentsPage } from './pages/PaymentsPage';
import { NewPaymentPage } from './pages/NewPaymentPage';

import { RetailersPage } from './pages/RetailersPage';
import { NewRetailerPage } from './pages/NewRetailerPage';
import { RetailerDetailPage } from './pages/RetailerDetailPage';
import { AllocateCreditsPage } from './pages/AllocateCreditsPage';

import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';

// Overlays
import { GlobalSearchDialog } from './components/GlobalSearchDialog';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-700 text-sm font-semibold">
        Authenticating...
      </div>
    );
  }

  // If unauthenticated, redirect to /login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is restricted (e.g. Retailer trying to access Super Admin route)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main Layout Wrapper
const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sidebarState, setSidebarState] = useState('EXPANDED'); // 'EXPANDED' | 'COLLAPSED' | 'CLOSED'

  const toggleSidebar = () => {
    setSidebarState((prev) => {
      if (prev === 'EXPANDED') return 'COLLAPSED';
      if (prev === 'COLLAPSED') return 'CLOSED';
      return 'EXPANDED';
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex font-sans selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      {/* 1. Left Sidebar */}
      <Sidebar sidebarState={sidebarState} setSidebarState={setSidebarState} />

      {/* 2. Right Main Workspace Area (Navbar + Page Content) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden transition-all duration-300">
        {/* Fixed Top Navbar */}
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          sidebarState={sidebarState}
          onToggleSidebar={toggleSidebar}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 min-w-0">
          {children}
        </main>
      </div>

      {/* Global Search Dialog Overlay */}
      <GlobalSearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectDevice={(dev) => navigate(`/devices/${dev.deviceId}`)}
        onSelectContract={(c) => navigate(`/contracts/${c.contractId}`)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected App Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DashboardPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/devices"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DevicesPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/devices/enroll"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <EnrollDevicePage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/devices/:deviceId"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DeviceDetailPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/contracts"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ContractsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/contracts/:contractId"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ContractDetailPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/credit-check"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CreditCheckPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/payments"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PaymentsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/payments/new"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <NewPaymentPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Super Admin Restricted Routes */}
              <Route
                path="/retailers"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <MainLayout>
                      <RetailersPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/retailers/new"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <MainLayout>
                      <NewRetailerPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/retailers/:retailerId"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <MainLayout>
                      <RetailerDetailPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/retailers/:retailerId/credits"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <MainLayout>
                      <AllocateCreditsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AuditLogsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <MainLayout>
                      <SettingsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ProfilePage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};
