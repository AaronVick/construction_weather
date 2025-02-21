// src/types/subscription.ts

export type SubscriptionPlan = 'none' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trial' | 'incomplete';
export type BillingCycle = 'monthly' | 'annually';

export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  billing_cycle?: 'monthly' | 'annually'; 
  start_date?: string;
  next_billing_date?: string;
  trial_end?: string;
  end_date?: string;
  created_at?: string;
  payment_method?: {
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
  };
  features?: {
    maxJobsites?: number;
    maxEmailTemplates?: number;
    advancedAnalytics?: boolean;
    customEmails?: boolean;
    prioritySupport?: boolean;
    smsNotifications?: boolean;
    customReports?: boolean;
    apiAccess?: boolean;
    whiteLabeling?: boolean;
    singleSignOn?: boolean;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  last4?: string | null;
  brand?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  isDefault: boolean;
}

export interface SubscriptionFeatures {
  maxJobsites: number;
  maxEmailTemplates: number;
  advancedAnalytics: boolean;
  customEmails: boolean;
  prioritySupport: boolean;
  smsNotifications: boolean;
  customReports: boolean;
  apiAccess: boolean;
  whiteLabeling: boolean;
  singleSignOn: boolean;
}

export interface BillingHistory {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  invoice?: string;
  invoiceUrl?: string;
}

export interface PlanOption {
  id: SubscriptionPlan;
  name: string;
  description: string;
  pricing: {
    monthly: number;
    annually: number;
  };
  features: string[];
  limitations?: string[];
}
