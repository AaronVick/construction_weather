import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import LoadingScreen from '../ui/LoadingScreen';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredSubscription?: 'basic' | 'premium' | 'enterprise';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requiredSubscription 
}) => {
  const { user, loading } = useSupabaseAuth();
  const location = useLocation();
  
  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If using children prop
  if (children) {
    return <>{children}</>;
  }
  
  // If using as a layout route
  return <Outlet />;
};

export default ProtectedRoute;