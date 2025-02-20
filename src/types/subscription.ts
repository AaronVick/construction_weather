// src/types/subscription.ts

export type SubscriptionPlan = 'none' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trial' | 'incomplete';
export type BillingCycle = 'monthly' | 'annually';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  priceId?: string;
  customerId?: string;
  startDate: string;
  endDate?: string;
  trialEnd?: string;
  nextBillingDate: string;
  cancellationDate?: string;
  paymentMethod?: PaymentMethod;
  features: SubscriptionFeatures;
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
  amount: number;
  description: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  invoiceUrl?: string;
  receiptUrl?: string;
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