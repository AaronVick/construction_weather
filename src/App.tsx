// // src/App.tsx

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

// Error boundary
import ErrorBoundary from './components/ErrorBoundary';

const AppRoutes: React.FC = () => {
  console.log('App initializing');
  const { user, loading } = useSupabaseAuth();

  if (loading) {
    console.log('Loading user data...');
    return <LoadingScreen />;
  }

  console.log('User:', user ? 'Authenticated' : 'Not authenticated');

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
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

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Client Routes */}
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/new" element={<ClientDetail />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route
            path="/clients/:id/edit"
            element={<ClientDetail isEdit={true} />}
          />

          {/* Jobsite Routes - Premium Feature */}
          <Route
            path="/jobsites"
            element={
              <PremiumFeature requiredPlan="premium" fallback="/subscription">
                <Jobsites />
              </PremiumFeature>
            }
          />
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

          {/* Worker Routes */}
          <Route path="/workers" element={<Workers />} />
          <Route path="/workers/new" element={<WorkerDetail />} />
          <Route path="/workers/:id" element={<WorkerDetail />} />
          <Route
            path="/workers/:id/edit"
            element={<WorkerDetail isEdit={true} />}
          />

          {/* Configuration Routes */}
          <Route path="/weather" element={<WeatherAutomation />} />
          <Route path="/email" element={<EmailConfiguration />} />

          {/* Analytics - Premium Feature */}
          <Route
            path="/analytics"
            element={
              <PremiumFeature requiredPlan="premium" fallback="/subscription">
                <Analytics />
              </PremiumFeature>
            }
          />

          {/* Settings Routes */}
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;




// before console logging

// import React, { useEffect } from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { SupabaseProvider } from './contexts/SupabaseContext';
// import { ThemeProvider } from './contexts/ThemeContext';
// import { SubscriptionProvider } from './contexts/SubscriptionContext';
// import { ToastProvider } from './contexts/ToastContext';
// import { useSupabaseAuth } from './hooks/useSupabaseAuth';

// // Landing Page
// import LandingPage from './pages/LandingPage';

// // Layouts
// import DashboardLayout from './components/layout/DashboardLayout';

// // Auth Pages
// import Login from './pages/auth/Login';
// import Register from './pages/auth/Register';
// import ForgotPassword from './pages/auth/ForgotPassword';
// import ResetPassword from './pages/auth/ResetPassword';

// // Dashboard Pages
// import Dashboard from './pages/dashboard/Dashboard';
// import Clients from './pages/dashboard/Clients';
// import ClientDetail from './pages/dashboard/ClientDetail';
// import Jobsites from './pages/dashboard/Jobsites';
// import JobsiteDetail from './pages/dashboard/JobsiteDetail';
// import Workers from './pages/dashboard/Workers';
// import WorkerDetail from './pages/dashboard/WorkerDetail';
// import WeatherAutomation from './pages/dashboard/WeatherAutomation';
// import EmailConfiguration from './pages/dashboard/EmailConfiguration';
// import Analytics from './pages/dashboard/Analytics';
// import Subscription from './pages/dashboard/Subscription';
// import Settings from './pages/dashboard/Settings';

// // Utility components
// import ProtectedRoute from './components/auth/ProtectedRoute';
// import PremiumFeature from './components/subscription/PremiumFeature';
// import LoadingScreen from './components/ui/LoadingScreen';
// import NotFound from './pages/NotFound';

// // error boundary
// import ErrorBoundary from './components/ErrorBoundary';

// const AppRoutes: React.FC = () => {
//   console.log('App initializing');
//   const { user, loading } = useSupabaseAuth();
  
//   if (loading) {
//     return <LoadingScreen />;
//   }
  
//   return (
//     <Routes>
//       {/* Public Routes */}
//       <Route path="/" element={<LandingPage />} />
//       <Route 
//         path="/login" 
//         element={user ? <Navigate to="/dashboard" /> : <Login />} 
//       />
//       <Route 
//         path="/register" 
//         element={user ? <Navigate to="/dashboard" /> : <Register />} 
//       />
//       <Route path="/forgot-password" element={<ForgotPassword />} />
//       <Route path="/reset-password" element={<ResetPassword />} />

//       {/* Protected Dashboard Routes */}
//       <Route element={<ProtectedRoute />}>
//         <Route element={<DashboardLayout />}>
//           <Route path="/dashboard" element={<Dashboard />} />
          
//           {/* Client Routes */}
//           <Route path="/clients" element={<Clients />} />
//           <Route path="/clients/new" element={<ClientDetail />} />
//           <Route path="/clients/:id" element={<ClientDetail />} />
//           <Route 
//             path="/clients/:id/edit" 
//             element={<ClientDetail isEdit={true} />} 
//           />
          
//           {/* Jobsite Routes - Premium Feature */}
//           <Route 
//             path="/jobsites" 
//             element={
//               <PremiumFeature requiredPlan="premium" fallback="/subscription">
//                 <Jobsites />
//               </PremiumFeature>
//             } 
//           />
//           <Route 
//             path="/jobsites/new" 
//             element={
//               <PremiumFeature requiredPlan="premium" fallback="/subscription">
//                 <JobsiteDetail />
//               </PremiumFeature>
//             } 
//           />
//           <Route 
//             path="/jobsites/:id" 
//             element={
//               <PremiumFeature requiredPlan="premium" fallback="/subscription">
//                 <JobsiteDetail />
//               </PremiumFeature>
//             } 
//           />
          
//           {/* Worker Routes */}
//           <Route path="/workers" element={<Workers />} />
//           <Route path="/workers/new" element={<WorkerDetail />} />
//           <Route path="/workers/:id" element={<WorkerDetail />} />
//           <Route 
//             path="/workers/:id/edit" 
//             element={<WorkerDetail isEdit={true} />} 
//           />
          
//           {/* Configuration Routes */}
//           <Route path="/weather" element={<WeatherAutomation />} />
//           <Route path="/email" element={<EmailConfiguration />} />
          
//           {/* Analytics - Premium Feature */}
//           <Route 
//             path="/analytics" 
//             element={
//               <PremiumFeature requiredPlan="premium" fallback="/subscription">
//                 <Analytics />
//               </PremiumFeature>
//             } 
//           />
          
//           {/* Settings Routes */}
//           <Route path="/subscription" element={<Subscription />} />
//           <Route path="/settings" element={<Settings />} />
//         </Route>
//       </Route>

//       {/* 404 Route */}
//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   );
// };

// const App: React.FC = () => {
//   return (
//     <ErrorBoundary> 
//     <BrowserRouter>
//       <ThemeProvider>
//         <SupabaseProvider>
//           <SubscriptionProvider>
//             <ToastProvider>
//               <AppRoutes />
//             </ToastProvider>
//           </SubscriptionProvider>
//         </SupabaseProvider>
//       </ThemeProvider>
//     </BrowserRouter>
//    </ErrorBoundary>
//   );
// };

// export default App;