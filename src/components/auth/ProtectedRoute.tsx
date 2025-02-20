// src/components/auth/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabase } from '../../contexts/SupabaseContext';
import LoadingScreen from '../ui/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredSubscription?: 'basic' | 'premium' | 'enterprise';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requiredSubscription
}) => {
  const { user, isLoading } = useSupabase();
  const location = useLocation();
  
  // If still checking auth state, show loading
  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If subscription check is required, that would be handled here
  // This would typically check against the user's subscription from context/store
  // For this example, we're assuming all authenticated users can access the route
  
  // If all checks pass, render the children
  return <>{children}</>;
};

export default ProtectedRoute;