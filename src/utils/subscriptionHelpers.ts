// src/utils/subscriptionHelpers.ts

import { 
  Subscription, 
  PaymentMethod,
  PaymentMethodData,
  SubscriptionFeatures
} from '../types/subscription';

const defaultFeatures: SubscriptionFeatures = {
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
};

export function formatPaymentMethod(
  paymentMethod: PaymentMethod | null | undefined
): PaymentMethodData | null {
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

export function getNextBillingDate(cycle: 'monthly' | 'annually'): string {
  const nextDate = new Date();
  if (cycle === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }
  return nextDate.toISOString();
}

export function parseSubscriptionFeatures(featuresStr: string): SubscriptionFeatures {
  try {
    return JSON.parse(featuresStr);
  } catch {
    return defaultFeatures;
  }
}