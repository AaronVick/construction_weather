// src/contexts/AdminContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  AdminUser, 
  SubscriptionAnalytics, 
  BillingSummary,
  UserGrowthMetrics
} from '../types/admin';
import { 
  isAdmin, 
  getCurrentAdmin, 
  getSubscriptionAnalytics,
  getBillingSummary,
  getUserGrowthMetrics
} from '../services/adminService';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  adminUser: AdminUser | null;
  error: string | null;
  subscriptionAnalytics: SubscriptionAnalytics | null;
  billingSummary: BillingSummary | null;
  userGrowthMetrics: UserGrowthMetrics | null;
  refreshAdminData: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  refreshBillingSummary: () => Promise<void>;
  refreshUserMetrics: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useFirebaseAuth();
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [userGrowthMetrics, setUserGrowthMetrics] = useState<UserGrowthMetrics | null>(null);

  // Check if the current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('AdminContext - Checking admin status for user:', user?.email);
      
      if (!user) {
        console.log('AdminContext - No user, setting isAdmin to false');
        setIsAdminUser(false);
        setAdminUser(null);
        setIsLoading(false);
        return;
      }

      try {
        console.log('AdminContext - User exists, checking admin status');
        setIsLoading(true);
        
        // Force a small delay to ensure Firebase auth is fully initialized
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const adminStatus = await isAdmin();
        console.log('AdminContext - Admin status result:', adminStatus);
        
        setIsAdminUser(adminStatus);

        if (adminStatus) {
          console.log('AdminContext - User is admin, getting admin data');
          const admin = await getCurrentAdmin();
          console.log('AdminContext - Admin data:', admin);
          setAdminUser(admin);
          
          // Load initial data if admin
          console.log('AdminContext - Loading admin data');
          await Promise.all([
            refreshAnalytics(),
            refreshBillingSummary(),
            refreshUserMetrics()
          ]);
          console.log('AdminContext - Admin data loaded');
        } else {
          console.log('AdminContext - User is not an admin:', user.email);
        }
      } catch (err) {
        console.error('AdminContext - Error checking admin status:', err);
        setError('Failed to verify admin status');
      } finally {
        console.log('AdminContext - Finished checking admin status, isAdmin:', isAdminUser);
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Refresh admin user data
  const refreshAdminData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const admin = await getCurrentAdmin();
      setAdminUser(admin);
      setError(null);
    } catch (err) {
      console.error('Error refreshing admin data:', err);
      setError('Failed to refresh admin data');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh subscription analytics
  const refreshAnalytics = async () => {
    if (!isAdminUser) return;

    try {
      const analytics = await getSubscriptionAnalytics();
      setSubscriptionAnalytics(analytics);
      setError(null);
    } catch (err) {
      console.error('Error fetching subscription analytics:', err);
      setError('Failed to load subscription analytics');
    }
  };

  // Refresh billing summary
  const refreshBillingSummary = async () => {
    if (!isAdminUser) return;

    try {
      const summary = await getBillingSummary();
      setBillingSummary(summary);
      setError(null);
    } catch (err) {
      console.error('Error fetching billing summary:', err);
      setError('Failed to load billing summary');
    }
  };

  // Refresh user metrics
  const refreshUserMetrics = async () => {
    if (!isAdminUser) return;

    try {
      const metrics = await getUserGrowthMetrics();
      setUserGrowthMetrics(metrics);
      setError(null);
    } catch (err) {
      console.error('Error fetching user metrics:', err);
      setError('Failed to load user metrics');
    }
  };

  const value: AdminContextType = {
    isAdmin: isAdminUser,
    isLoading,
    adminUser,
    error,
    subscriptionAnalytics,
    billingSummary,
    userGrowthMetrics,
    refreshAdminData,
    refreshAnalytics,
    refreshBillingSummary,
    refreshUserMetrics
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
