import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ToastProvider } from './contexts/ToastContext';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';

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
const PremiumFeature = lazy(() => import('./components/subscription/PremiumFeature'));
const LoadingScreen = lazy(() => import('./components/ui/LoadingScreen'));
const ErrorBoundary = lazy(() => import('./components/ErrorBoundary'));

const AppRoutes: React.FC = () => {
  console.log('AppRoutes: Rendering...');
  const { user, loading, error } = useSupabaseAuth();

  if (loading) {
    console.log('AppRoutes: Loading user data...');
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LoadingScreen />
      </Suspense>
    );
  }

  if (error) {
    console.error('AppRoutes: Auth error:', error);
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded">
        Authentication error: {error.message}
      </div>
    );
  }

  console.log('AppRoutes: User:', user ? 'Authenticated' : 'Not authenticated');

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" /> : <LandingPage />}
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
            <Route path="/workers" element={<Workers />} />
            <Route path="/workers/new" element={<WorkerDetail />} />
            <Route path="/workers/:id" element={<WorkerDetail />} />
            <Route
              path="/workers/:id/edit"
              element={<WorkerDetail isEdit={true} />}
            />
            <Route path="/weather" element={<WeatherAutomation />} />
            <Route path="/email" element={<EmailConfiguration />} />
            <Route
              path="/analytics"
              element={
                <PremiumFeature requiredPlan="premium" fallback="/subscription">
                  <Analytics />
                </PremiumFeature>
              }
            />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/settings" element={<Settings />} />
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