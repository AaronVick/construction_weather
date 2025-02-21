// src/types/subscription.ts

export type SubscriptionPlan = 'none' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trial' | 'incomplete';
export type BillingCycle = 'monthly' | 'annually';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle; // ✅ Ensure this exists
  price_id?: string | null;
  customer_id?: string | null;
  start_date: string;
  end_date?: string | null; // ✅ Allow null
  trial_end?: string | null; // ✅ Allow null
  next_billing_date?: string | null; // ✅ Allow null
  cancellation_date?: string | null; // ✅ Allow null
  payment_method?: PaymentMethod | null; // ✅ Ensure it's nullable
  created_at: string;
  updated_at?: string | null;
  features?: SubscriptionFeatures; // ✅ Make optional if it’s not always returned
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
