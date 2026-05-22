/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Screen, User, Bill } from './types';
import { Login } from './screens/Login';
import { Dashboard } from './screens/Dashboard';
import { Bills } from './screens/Bills';
import { PaymentMethod } from './screens/PaymentMethod';
import { PaymentForm } from './screens/PaymentForm';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';

import { AdminSidebar } from './components/AdminSidebar';
import { AdminTopBar } from './components/AdminTopBar';
import { AdminDashboard } from './screens/admin/AdminDashboard';
import { CustomerManagement } from './screens/admin/CustomerManagement';
import { InputMeter } from './screens/admin/InputMeter';
import { AdminBills } from './screens/admin/AdminBills';
import { AdminPayments } from './screens/admin/AdminPayments';

const MOCK_USER: User = {
  name: "Budi Santoso",
  id: "10029384",
  avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256&h=256",
  role: "CUSTOMER",
  email: "budi@pdam.go.id",
  status: "Aktif"
};

const MOCK_ADMIN: User = {
  name: "Administrator",
  id: "ADM-902",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256&h=256",
  role: "ADMIN",
  email: "admin@pdam.go.id",
  status: "Aktif"
};

const MOCK_BILLS: Bill[] = [
  { id: '1', userId: '10029384', monthString: 'Mei', yearString: '2024', dueDate: '20 Mei 2024', meterStart: 1245, meterEnd: 1272, usage: 27.0, total: 185000, status: 'LUNAS', createdAt: new Date().toISOString() },
  { id: '2', userId: '10029384', monthString: 'April', yearString: '2024', dueDate: '20 April 2024', meterStart: 1210, meterEnd: 1245, usage: 35.0, total: 265000, status: 'BELUM_BAYAR', createdAt: new Date().toISOString() },
  { id: '3', userId: '10029384', monthString: 'Maret', yearString: '2024', dueDate: '20 Maret 2024', meterStart: 1185, meterEnd: 1210, usage: 25.0, total: 172500, status: 'MENUNGGU_VERIFIKASI', createdAt: new Date().toISOString() },
  { id: '4', userId: '10029384', monthString: 'Februari', yearString: '2024', dueDate: '20 Februari 2024', meterStart: 1162, meterEnd: 1185, usage: 23.0, total: 158000, status: 'LUNAS', createdAt: new Date().toISOString() },
  { id: '5', userId: '10029384', monthString: 'Januari', yearString: '2024', dueDate: '20 Januari 2024', meterStart: 1135, meterEnd: 1162, usage: 27.0, total: 185000, status: 'LUNAS', createdAt: new Date().toISOString() },
];

interface ProtectedRouteProps {
  currentUser: User | null;
  allowedRole: 'CUSTOMER' | 'ADMIN';
  children: React.ReactElement;
}

function ProtectedRoute({ currentUser, allowedRole, children }: ProtectedRouteProps) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role !== allowedRole) {
    return <Navigate to={currentUser.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} replace />;
  }
  return children;
}

interface CustomerLayoutProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
  selectedBill: Bill | null;
  setSelectedBill: (bill: Bill | null) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
}

function CustomerLayout({
  currentUser,
  setCurrentUser,
  selectedBill,
  setSelectedBill,
  selectedPaymentMethod,
  setSelectedPaymentMethod
}: CustomerLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pdam_user');
    localStorage.removeItem('pdam_screen');
    navigate('/login');
  };

  // Map the current path to the screen name for Sidebar highlighting
  let currentScreen: Screen = 'dashboard';
  if (location.pathname === '/bills') currentScreen = 'bills';
  else if (location.pathname === '/payment/method') currentScreen = 'payment-method';
  else if (location.pathname === '/payment/form') currentScreen = 'payment-form';

  const navigateToScreen = (screen: Screen) => {
    setIsSidebarOpen(false);
    if (screen === 'dashboard') navigate('/dashboard');
    else if (screen === 'bills') navigate('/bills');
    else if (screen === 'payment-method') navigate('/payment/method');
    else if (screen === 'payment-form') navigate('/payment/form');
    else if (screen === 'login') handleLogout();
  };

  return (
    <div className="min-h-screen bg-background relative">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <Sidebar currentScreen={currentScreen} navigate={navigateToScreen} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onLogout={handleLogout} />
      <TopBar user={currentUser} onMenuClick={() => setIsSidebarOpen(true)} />
      <main className="lg:ml-[280px] pt-16 transition-all duration-300">
        <div className="p-4 md:p-8 overflow-x-hidden">
          <Routes>
            <Route path="dashboard" element={
              <Dashboard 
                user={currentUser} 
                navigate={navigateToScreen} 
                setSelectedBill={setSelectedBill} 
              />
            } />
            <Route path="bills" element={
              <Bills 
                user={currentUser} 
                navigate={navigateToScreen} 
                setSelectedBill={setSelectedBill} 
              />
            } />
            <Route path="payment/method" element={
              <PaymentMethod 
                navigate={navigateToScreen} 
                selectedBill={selectedBill} 
                selectedMethod={selectedPaymentMethod}
                setSelectedMethod={setSelectedPaymentMethod}
              />
            } />
            <Route path="payment/form" element={
              <PaymentForm 
                user={currentUser} 
                navigate={navigateToScreen} 
                selectedBill={selectedBill} 
                selectedMethod={selectedPaymentMethod}
              />
            } />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

interface AdminLayoutProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
}

function AdminLayout({ currentUser, setCurrentUser }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pdam_user');
    localStorage.removeItem('pdam_screen');
    navigate('/login');
  };

  // Map path to screen for AdminSidebar highlighting
  let currentScreen: Screen = 'admin-dashboard';
  if (location.pathname === '/admin/customers') currentScreen = 'admin-customers';
  else if (location.pathname === '/admin/meter') currentScreen = 'admin-meter';
  else if (location.pathname === '/admin/bills') currentScreen = 'admin-bills';
  else if (location.pathname === '/admin/payments') currentScreen = 'admin-payments';

  const navigateToScreen = (screen: Screen) => {
    setIsSidebarOpen(false);
    if (screen === 'admin-dashboard') navigate('/admin/dashboard');
    else if (screen === 'admin-customers') navigate('/admin/customers');
    else if (screen === 'admin-meter') navigate('/admin/meter');
    else if (screen === 'admin-bills') navigate('/admin/bills');
    else if (screen === 'admin-payments') navigate('/admin/payments');
    else if (screen === 'login') handleLogout();
  };

  return (
    <div className="min-h-screen bg-background relative">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <AdminSidebar currentScreen={currentScreen} navigate={navigateToScreen} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onLogout={handleLogout} />
      <AdminTopBar user={currentUser} onMenuClick={() => setIsSidebarOpen(true)} />
      <main className="lg:ml-[280px] pt-16 transition-all duration-300">
        <div className="p-4 md:p-8 overflow-x-hidden">
          <Routes>
            <Route path="dashboard" element={<AdminDashboard navigate={navigateToScreen} />} />
            <Route path="customers" element={<CustomerManagement navigate={navigateToScreen} />} />
            <Route path="meter" element={<InputMeter navigate={navigateToScreen} />} />
            <Route path="bills" element={<AdminBills navigate={navigateToScreen} />} />
            <Route path="payments" element={<AdminPayments navigate={navigateToScreen} />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pdam_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('bca-va');

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          currentUser ? (
            <Navigate to={currentUser.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} replace />
          ) : (
            <Login 
              navigate={(screen) => {
                // Compatible callback mapping
                window.location.href = screen === 'admin-dashboard' ? '/admin/dashboard' : '/dashboard';
              }} 
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                localStorage.setItem('pdam_user', JSON.stringify(user));
              }} 
            />
          )
        } />

        {/* Customer Routes (Protected) */}
        <Route path="/*" element={
          <ProtectedRoute currentUser={currentUser} allowedRole="CUSTOMER">
            <CustomerLayout
              currentUser={currentUser!}
              setCurrentUser={setCurrentUser}
              selectedBill={selectedBill}
              setSelectedBill={setSelectedBill}
              selectedPaymentMethod={selectedPaymentMethod}
              setSelectedPaymentMethod={setSelectedPaymentMethod}
            />
          </ProtectedRoute>
        } />

        {/* Admin Routes (Protected) */}
        <Route path="/admin/*" element={
          <ProtectedRoute currentUser={currentUser} allowedRole="ADMIN">
            <AdminLayout
              currentUser={currentUser!}
              setCurrentUser={setCurrentUser}
            />
          </ProtectedRoute>
        } />

        {/* Catch All Redirect */}
        <Route path="*" element={
          <Navigate to={currentUser ? (currentUser.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard') : '/login'} replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}


