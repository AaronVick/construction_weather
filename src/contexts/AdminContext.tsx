// src/contexts/AdminContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';

// Define the admin user type
interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'super_admin';
  permissions?: string[];
}

// Define analytics types
interface SubscriptionAnalytics {
  mrr: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  churnRate: number;
  totalSubscriptions: number;
  planDistribution: Record<string, number>;
}

interface BillingSummary {
  totalRevenue: number;
  currentMonthRevenue: number;
  revenueGrowth: number;
  paidInvoices: number;
  pendingInvoices: number;
  failedInvoices: number;
  refundedAmount: number;
}

interface UserGrowthMetrics {
  totalUsers: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
  conversionRate: number;
}

// Define the context type
interface AdminContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  billingSummary: BillingSummary | null;
  subscriptionAnalytics: SubscriptionAnalytics | null;
  userGrowthMetrics: UserGrowthMetrics | null;
  refreshAnalytics: () => Promise<void>;
  refreshBillingSummary: () => Promise<void>;
  refreshUserMetrics: () => Promise<void>;
}

// Create the context with default values
const AdminContext = createContext<AdminContextType>({
  adminUser: null,
  isLoading: false,
  isAdmin: false,
  billingSummary: null,
  subscriptionAnalytics: null,
  userGrowthMetrics: null,
  refreshAnalytics: async () => {},
  refreshBillingSummary: async () => {},
  refreshUserMetrics: async () => {}
});

// Provider component
interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  // In a real implementation, this would fetch admin data from an API or database
  // For testing, we're hardcoding the admin user to match the Firebase admin record
  const adminUser: AdminUser = {
    id: 'admin-1',
    email: 'me@tokensintl.com',
    firstName: 'Aaron',
    lastName: 'V',
    role: 'super_admin',
    permissions: [
      'manage_users',
      'manage_subscriptions',
      'view_analytics',
      'manage_billing',
      'manage_settings',
      'manage_admins',
      'support_access'
    ]
  };
  
  console.log('AdminProvider initialized with user:', adminUser);

  // Mock analytics data
  const mockSubscriptionAnalytics: SubscriptionAnalytics = {
    mrr: 12500,
    activeSubscriptions: 250,
    canceledSubscriptions: 15,
    churnRate: 0.06,
    totalSubscriptions: 265,
    planDistribution: {
      basic: 150,
      premium: 75,
      enterprise: 25,
      none: 15
    }
  };

  const mockBillingSummary: BillingSummary = {
    totalRevenue: 150000,
    currentMonthRevenue: 12500,
    revenueGrowth: 8.5,
    paidInvoices: 245,
    pendingInvoices: 12,
    failedInvoices: 3,
    refundedAmount: 1200
  };

  const mockUserGrowthMetrics: UserGrowthMetrics = {
    totalUsers: 320,
    newUsersThisMonth: 35,
    userGrowthRate: 12.3,
    conversionRate: 0.78
  };

  // Mock refresh functions
  const refreshAnalytics = async () => {
    console.log('Refreshing subscription analytics...');
    // In a real implementation, this would fetch data from an API
    return Promise.resolve();
  };

  const refreshBillingSummary = async () => {
    console.log('Refreshing billing summary...');
    // In a real implementation, this would fetch data from an API
    return Promise.resolve();
  };

  const refreshUserMetrics = async () => {
    console.log('Refreshing user metrics...');
    // In a real implementation, this would fetch data from an API
    return Promise.resolve();
  };

  return (
    <AdminContext.Provider value={{ 
      adminUser, 
      isLoading: false,
      isAdmin: true,
      billingSummary: mockBillingSummary,
      subscriptionAnalytics: mockSubscriptionAnalytics,
      userGrowthMetrics: mockUserGrowthMetrics,
      refreshAnalytics,
      refreshBillingSummary,
      refreshUserMetrics
    }}>
      {children}
    </AdminContext.Provider>
  );
};

// Hook to use the admin context
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
