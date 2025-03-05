// src/types/admin.ts

// Admin user type
export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: AdminRole;
  permissions: AdminPermission[];
  lastLogin?: string;
  created_at: string;
  updated_at: string | null;
}

// Admin roles
export type AdminRole = 'super_admin' | 'admin' | 'billing_admin' | 'support_admin';

// Admin permissions
export type AdminPermission = 
  | 'manage_users'
  | 'manage_subscriptions'
  | 'view_analytics'
  | 'manage_billing'
  | 'manage_settings'
  | 'manage_admins'
  | 'support_access';

// Subscription analytics
export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  trialSubscriptions: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  churnRate: number;
  planDistribution: {
    [key: string]: number;
  };
  growthRate: number;
  averageSubscriptionValue: number;
}

// Subscription metrics over time
export interface SubscriptionMetricsTimeSeries {
  date: string;
  totalSubscriptions: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  mrr: number;
  newSubscriptions: number;
  churnedSubscriptions: number;
}

// Billing summary
export interface BillingSummary {
  totalRevenue: number;
  pendingInvoices: number;
  failedInvoices: number;
  paidInvoices: number;
  refundedAmount: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowth: number;
}

// User growth metrics
export interface UserGrowthMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  newUsersPreviousMonth: number;
  userGrowthRate: number;
  conversionRate: number; // Free to paid conversion
}
