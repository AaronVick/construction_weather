// src/types/subscription.ts

// Base types that match the database constraints and UI usage
export type SubscriptionPlan = 'none' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'cancelled' | 'expired' | 'past_due' | 'trial' | 'incomplete';
export type BillingCycle = 'monthly' | 'annually';

// Payment method for full payment details
export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  last4: string | null;
  brand: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
}

// Simplified payment method for subscription context
export interface SubscriptionPaymentMethod {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
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
  payment_method: SubscriptionPaymentMethod | null;
  features: SubscriptionFeatures;
  created_at: string;
  updated_at: string | null;
  currentPeriodEnd: string;
}

// Billing history
export interface BillingHistory {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  invoice: string | null;
  invoiceUrl: string | null;
}

// Plan option for UI
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
  icon?: React.ReactNode;
  recommendedFor?: string;
}

// Default subscription object with all required fields
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

// Helper functions for type conversion
export function formatPaymentMethodForSubscription(
  paymentMethod: PaymentMethod | null | undefined
): SubscriptionPaymentMethod | null {
  if (!paymentMethod) return null;
  return {
    brand: paymentMethod.brand,
    last4: paymentMethod.last4,
    expMonth: paymentMethod.expMonth,
    expYear: paymentMethod.expYear
  };
}

export function createUpdatedSubscription(
  prevState: Subscription,
  updates: Partial<Subscription>
): Subscription {
  return {
    ...prevState,
    ...updates,
    updated_at: new Date().toISOString()
  };
}