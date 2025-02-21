// src/types/subscription.ts

export type SubscriptionPlan = 'none' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trial' | 'incomplete';
export type BillingCycle = 'monthly' | 'annually';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  price_id?: string;
  customer_id?: string;
  start_date: string;
  end_date?: string;
  trial_end?: string;
  next_billing_date: string;
  cancellation_date?: string;
  payment_method?: PaymentMethod;
  created_at: string;
  updated_at?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
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