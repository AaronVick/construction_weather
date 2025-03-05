// src/components/auth/AdminProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useAdmin } from '../../contexts/AdminContext';
import LoadingScreen from '../ui/LoadingScreen';

interface AdminProtectedRouteProps {
  redirectPath?: string;
}

/**
 * A wrapper component that protects routes for admin users only
 * Redirects to login or dashboard if not authenticated or not an admin
 */
const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ 
  redirectPath = '/login'
}) => {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { isAdmin, isLoading: adminLoading, adminUser } = useAdmin();
  
  console.log('AdminProtectedRoute - Auth State:', { 
    user: user?.email, 
    authLoading, 
    isAdmin, 
    adminLoading,
    adminUser
  });
  
  // Show loading screen while checking authentication and admin status
  if (authLoading || adminLoading) {
    console.log('AdminProtectedRoute - Loading state, showing loading screen');
    return <LoadingScreen />;
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    console.log('AdminProtectedRoute - No user, redirecting to login');
    return <Navigate to={redirectPath} replace />;
  }
  
  // If authenticated but not an admin, redirect to dashboard
  if (!isAdmin) {
    console.log('AdminProtectedRoute - User is not an admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  // If authenticated and admin, render the protected route
  console.log('AdminProtectedRoute - User is admin, rendering protected route');
  return <Outlet />;
};

export default AdminProtectedRoute;
