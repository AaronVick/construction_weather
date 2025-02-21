// src/App.tsx

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ToastProvider } from './contexts/ToastContext';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';

// Landing Page
import LandingPage from './pages/LandingPage';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import Clients from './pages/dashboard/Clients';
import ClientDetail from './pages/dashboard/ClientDetail';
import Jobsites from './pages/dashboard/Jobsites';
import JobsiteDetail from './pages/dashboard/JobsiteDetail';
import Workers from './pages/dashboard/Workers';
import WorkerDetail from './pages/dashboard/WorkerDetail';
import WeatherAutomation from './pages/dashboard/WeatherAutomation';
import EmailConfiguration from './pages/dashboard/EmailConfiguration';
import Analytics from './pages/dashboard/Analytics';
import Subscription from './pages/dashboard/Subscription';
import Settings from './pages/dashboard/Settings';

// Utility components
import ProtectedRoute from './components/auth/ProtectedRoute';
import PremiumFeature from './components/subscription/PremiumFeature';
import LoadingScreen from './components/ui/LoadingScreen';
import NotFound from './pages/NotFound';

const AppRoutes: React.FC = () => {
  const { user, loading } = useSupabaseAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return (
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
    
        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
    
        {/* Client Management Routes */}
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Clients />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/new"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ClientDetail />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ClientDetail />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id/edit"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ClientDetail isEdit={true} />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
    
        {/* Jobsite Management Routes - Premium Feature */}
        <Route
          path="/jobsites"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PremiumFeature requiredPlan="premium" fallback="/subscription">
                  <Jobsites />
                </PremiumFeature>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobsites/new"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PremiumFeature requiredPlan="premium" fallback="/subscription">
                  <JobsiteDetail />
                </PremiumFeature>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobsites/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PremiumFeature requiredPlan="premium" fallback="/subscription">
                  <JobsiteDetail />
                </PremiumFeature>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
    
        {/* Worker Management Routes */}
        <Route
          path="/workers"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Workers />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workers/new"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <WorkerDetail />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workers/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <WorkerDetail />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workers/:id/edit"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <WorkerDetail isEdit={true} />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
    
        {/* Weather and Email Configuration Routes */}
        <Route
          path="/weather"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <WeatherAutomation />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/email"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <EmailConfiguration />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
    
        {/* Analytics - Premium Feature */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PremiumFeature requiredPlan="premium" fallback="/subscription">
                  <Analytics />
                </PremiumFeature>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
    
        {/* Subscription and Settings Routes */}
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Subscription />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
    
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SupabaseProvider>
          <SubscriptionProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </SubscriptionProvider>
        </SupabaseProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;