import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import Layout from './components/Layout';
import { Toaster } from 'sonner';

// Placeholder Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UploadDocs from './pages/UploadDocs';
import Agreement from './pages/Agreement';
import Payment from './pages/Payment';
import Confirmation from './pages/Confirmation';
import MyBookings from './pages/MyBookings';

import Logout from './pages/Logout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCars from './pages/admin/AdminCars';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminPackages from './pages/admin/AdminPackages';
import AdminFinancials from './pages/admin/AdminFinancials';
import AdminLogout from './pages/admin/AdminLogout';
import PendingVerification from './pages/PendingVerification';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeCars from './pages/employee/EmployeeCars';
import EmployeePackages from './pages/employee/EmployeePackages';
import EmployeeReports from './pages/employee/EmployeeReports';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Packages from './pages/Packages';
import Fleet from './pages/Fleet';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="teddy-ui-theme">
      <Toaster position="top-center" richColors toastOptions={{ className: 'font-sans' }} />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/fleet" element={<Fleet />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              <Route path="/upload-docs" element={
                <ProtectedRoute roles={['CUSTOMER']}><UploadDocs /></ProtectedRoute>
              } />
              <Route path="/agreement" element={
                <ProtectedRoute roles={['CUSTOMER']}><Agreement /></ProtectedRoute>
              } />
              <Route path="/pending-verification" element={
                <ProtectedRoute roles={['CUSTOMER']}><PendingVerification /></ProtectedRoute>
              } />
              <Route path="/payment" element={
                <ProtectedRoute roles={['CUSTOMER']}><Payment /></ProtectedRoute>
              } />
              <Route path="/confirmation" element={
                <ProtectedRoute roles={['CUSTOMER']}><Confirmation /></ProtectedRoute>
              } />
              <Route path="/my-bookings" element={
                <ProtectedRoute roles={['CUSTOMER']}><MyBookings /></ProtectedRoute>
              } />
              <Route path="/logout" element={<Logout />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/cars" element={
              <ProtectedRoute roles={['ADMIN']}><AdminCars /></ProtectedRoute>
            } />
            <Route path="/admin/employees" element={
              <ProtectedRoute roles={['ADMIN']}><AdminEmployees /></ProtectedRoute>
            } />
            <Route path="/admin/packages" element={
              <ProtectedRoute roles={['ADMIN']}><AdminPackages /></ProtectedRoute>
            } />
            <Route path="/admin/financials" element={
              <ProtectedRoute roles={['ADMIN']}><AdminFinancials /></ProtectedRoute>
            } />
            <Route path="/admin/logout" element={<AdminLogout />} />

            {/* Employee Routes */}
            <Route path="/employee/dashboard" element={
              <ProtectedRoute roles={['EMPLOYEE', 'ADMIN']}><EmployeeDashboard /></ProtectedRoute>
            } />
            <Route path="/employee/cars" element={
              <ProtectedRoute roles={['EMPLOYEE', 'ADMIN']}><EmployeeCars /></ProtectedRoute>
            } />
            <Route path="/employee/packages" element={
              <ProtectedRoute roles={['EMPLOYEE', 'ADMIN']}><EmployeePackages /></ProtectedRoute>
            } />
            <Route path="/employee/reports" element={
              <ProtectedRoute roles={['EMPLOYEE', 'ADMIN']}><EmployeeReports /></ProtectedRoute>
            } />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}


export default App;
