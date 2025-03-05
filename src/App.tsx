// src/App.tsx

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ToastProvider } from './contexts/ToastContext';
import { AdminProvider } from './contexts/AdminContext';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { useAdmin } from './contexts/AdminContext';
import './index.css'; // Ensure this imports Tailwind CSS
import './styles/globals.css'; // Import global styles if you have them


// Landing Page (not lazy-loaded since it's the main public page)
import LandingPage from './pages/LandingPage';

// Lazy-loaded components
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Clients = lazy(() => import('./pages/dashboard/Clients'));
const ClientDetail = lazy(() => import('./pages/dashboard/ClientDetail'));
const Jobsites = lazy(() => import('./pages/dashboard/Jobsites'));
const JobsiteDetail = lazy(() => import('./pages/dashboard/JobsiteDetail'));
const Workers = lazy(() => import('./pages/dashboard/Workers'));
const WorkerDetail = lazy(() => import('./pages/dashboard/WorkerDetail'));
const WeatherAutomation = lazy(() => import('./pages/dashboard/WeatherAutomation'));
const EmailConfiguration = lazy(() => import('./pages/dashboard/EmailConfiguration'));
const Analytics = lazy(() => import('./pages/dashboard/Analytics'));
const Subscription = lazy(() => import('./pages/dashboard/Subscription'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ProtectedRoute = lazy(() => import('./components/auth/ProtectedRoute'));
const AdminProtectedRoute = lazy(() => import('./components/auth/AdminProtectedRoute'));
const PremiumFeature = lazy(() => import('./components/subscription/PremiumFeature'));
const LoadingScreen = lazy(() => import('./components/ui/LoadingScreen'));
const ErrorBoundary = lazy(() => import('./components/ErrorBoundary'));

// Admin components
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminSubscriptions = lazy(() => import('./pages/admin/Subscriptions'));
const AdminRevenue = lazy(() => import('./pages/admin/Revenue'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminBilling = lazy(() => import('./pages/admin/Billing'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

const AppRoutes: React.FC = () => {
  const { user, isLoading: loading } = useFirebaseAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  
  console.log('AppRoutes - Auth State:', { 
    user: user?.email, 
    loading, 
    isAdmin, 
    adminLoading,
    path: window.location.pathname
  });
  
  const isPublicRoute = window.location.pathname === '/' || 
                       window.location.pathname === '/login' || 
                       window.location.pathname === '/register' ||
                       window.location.pathname === '/forgot-password' ||
                       window.location.pathname === '/reset-password' ||
                       window.location.pathname === '/admin/login';
  
  const isAdminRoute = window.location.pathname.startsWith('/admin/');

  // Only show loading screen for authenticated routes
  if ((loading || adminLoading) && !isPublicRoute) {
    console.log('AppRoutes - Showing loading screen for authenticated route');
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LoadingScreen />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes - No auth check needed */}
        <Route
          path="/"
          element={<LandingPage />}
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <Register />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Admin Login - Separate from user login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/new" element={<ClientDetail />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route
              path="/clients/:id/edit"
              element={<ClientDetail isEdit={true} />}
            />
            <Route path="/jobsites" element={<Jobsites />} />
            <Route
              path="/jobsites/new"
              element={
                <PremiumFeature requiredPlan="premium" fallback="/subscription">
                  <JobsiteDetail />
                </PremiumFeature>
              }
            />
            <Route
              path="/jobsites/:id"
              element={
                <PremiumFeature requiredPlan="premium" fallback="/subscription">
                  <JobsiteDetail />
                </PremiumFeature>
              }
            />
            <Route path="/workers" element={<Workers />} />
            <Route path="/workers/new" element={<WorkerDetail />} />
            <Route path="/workers/:id" element={<WorkerDetail />} />
            <Route
              path="/workers/:id/edit"
              element={<WorkerDetail isEdit={true} />}
            />
            <Route path="/weather" element={<WeatherAutomation />} />
            <Route path="/email" element={<EmailConfiguration />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/admin/billing" element={<AdminBilling />} />
            <Route path="/admin/revenue" element={<AdminRevenue />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <FirebaseProvider>
            <SubscriptionProvider>
              <AdminProvider>
                <ToastProvider>
                  <AppRoutes />
                </ToastProvider>
              </AdminProvider>
            </SubscriptionProvider>
          </FirebaseProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
