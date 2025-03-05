import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useAdmin } from '../../contexts/AdminContext';
import LoadingScreen from '../ui/LoadingScreen';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredSubscription?: 'basic' | 'premium' | 'enterprise';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requiredSubscription 
}) => {
  const { user, isLoading: loading } = useFirebaseAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const location = useLocation();
  
  console.log('ProtectedRoute - Auth State:', { 
    user: user?.email, 
    loading, 
    isAdmin, 
    adminLoading,
    path: location.pathname
  });
  
  // Check if this is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin/');
  
  if (loading) {
    console.log('ProtectedRoute - Loading state, showing loading screen');
    return <LoadingScreen message="Checking authentication..." />;
  }
  
  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If this is an admin route and the user is an admin, let the AdminProtectedRoute handle it
  if (isAdminRoute && isAdmin) {
    console.log('ProtectedRoute - Admin route detected for admin user, passing through');
    // If using children prop
    if (children) {
      return <>{children}</>;
    }
    
    // If using as a layout route
    return <Outlet />;
  }
  
  // If using children prop
  if (children) {
    console.log('ProtectedRoute - Rendering children');
    return <>{children}</>;
  }
  
  // If using as a layout route
  console.log('ProtectedRoute - Rendering outlet');
  return <Outlet />;
};

export default ProtectedRoute;
