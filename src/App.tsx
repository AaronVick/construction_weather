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
      {/* Landing Page Route - Public */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Dashboard Routes - Protected */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                {/* Main Dashboard */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Clients Management */}
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/clients/new" element={<ClientDetail />} />
                <Route path="/clients/:id/edit" element={<ClientDetail isEdit={true} />} />

                {/* Jobsites - Premium Feature */}
                <Route path="/jobsites" element={
                  <PremiumFeature fallback="/subscription">
                    <Jobsites />
                  </PremiumFeature>
                } />
                <Route path="/jobsites/:id" element={
                  <PremiumFeature fallback="/subscription">
                    <JobsiteDetail />
                  </PremiumFeature>
                } />
                <Route path="/jobsites/new" element={
                  <PremiumFeature fallback="/subscription">
                    <JobsiteDetail />
                  </PremiumFeature>
                } />

                {/* Workers Management */}
                <Route path="/workers" element={<Workers />} />
                <Route path="/workers/:id" element={<WorkerDetail />} />
                <Route path="/workers/new" element={<WorkerDetail />} />
                <Route path="/workers/:id/edit" element={<WorkerDetail isEdit={true} />} />

                {/* Weather Automation */}
                <Route path="/weather" element={<WeatherAutomation />} />

                {/* Email Configuration */}
                <Route path="/email" element={<EmailConfiguration />} />

                {/* Analytics - Premium Feature */}
                <Route path="/analytics" element={
                  <PremiumFeature fallback="/subscription">
                    <Analytics />
                  </PremiumFeature>
                } />

                {/* Subscription & Settings */}
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
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