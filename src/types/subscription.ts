// src/types/subscription.ts

import { ReactNode } from 'react';

// All possible subscription plans
export type SubscriptionPlan = 'basic' | 'premium' | 'enterprise' | 'none';

// All possible subscription statuses (including UI states)
export type SubscriptionStatus = 
  | 'active' 
  | 'canceled'
  | 'cancelled'  // UI variant
  | 'expired'    // UI variant
  | 'past_due' 
  | 'trial' 
  | 'incomplete';

export type BillingCycle = 'monthly' | 'annually';

// Base payment method interface
export interface PaymentMethodData {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
}

// Extended payment method for full details
export interface PaymentMethod extends PaymentMethodData {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  isDefault: boolean;
}

// Subscription features
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

// Main subscription interface
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

// Billing history entry
export interface BillingHistory {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  invoice: string | null;
  invoiceUrl: string | null;
}

// Plan pricing structure
export interface PlanPricing {
  monthly: number;
  annually: number;
}

// Plan option for UI
export interface PlanOption {
  id: SubscriptionPlan;
  name: string;
  description: string;
  pricing: PlanPricing;
  features: string[];
  limitations?: string[];
  icon?: ReactNode;
  recommendedFor?: string;
}

// Default subscription state
export const defaultSubscription: Subscription = {
  id: '',
  user_id: '',
  plan: 'basic',
  status: 'active',
  billing_cycle: 'monthly',
  price_id: null,
  customer_id: null,
  start_date: new Date().toISOString(),
  end_date: null,
  trial_end: null,
  next_billing_date: new Date().toISOString(),
  cancellation_date: null,
  payment_method: {
    brand: null,
    last4: null,
    expMonth: null,
    expYear: null
  },
  features: {
    maxJobsites: 0,
    maxEmailTemplates: 0,
    advancedAnalytics: false,
    customEmails: false,
    prioritySupport: false,
    smsNotifications: false,
    customReports: false,
    apiAccess: false,
    whiteLabeling: false,
    singleSignOn: false
  },
  created_at: new Date().toISOString(),
  updated_at: null,
  currentPeriodEnd: new Date().toISOString()
};