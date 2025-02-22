// src/types/subscription.ts

import { ReactNode } from 'react';

// Exactly matching database constraints
export type SubscriptionPlan = 'none' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trial' | 'incomplete';
export type BillingCycle = 'monthly' | 'annually';

// Payment method types
export interface PaymentMethodData {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
}

export interface PaymentMethod extends PaymentMethodData {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  isDefault: boolean;
}

// Features schema
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

// Main subscription type matching database schema
export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  price_id: string | null;
  customer_id: string | null;
  start_date: string;
  end_date: string | null;
  trial_end: string | null;
  next_billing_date: string;
  cancellation_date: string | null;
  payment_method: PaymentMethodData | null;
  features: SubscriptionFeatures;
  created_at: string;
  updated_at: string | null;
  currentPeriodEnd: string;
}

// Billing history type
export interface BillingHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  invoice: string | null;
  invoiceUrl: string | null;
}

// UI-specific types
export interface PlanPricing {
  monthly: number;
  annually: number;
}

export interface PlanOption {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: {
    monthly: number;
    annually: number;
  };
  features: string[];
  limitations?: string[];
  icon?: ReactNode;
  recommendedFor?: string;
}