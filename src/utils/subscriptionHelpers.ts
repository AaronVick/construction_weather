// src/utils/subscriptionHelpers.ts

import { 
  Subscription, 
  PaymentMethod,
  PaymentMethodData
} from '../types/subscription';

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

export function getNextBillingDate(date: Date = new Date(), cycle: 'monthly' | 'annually'): string {
  const nextDate = new Date(date);
  if (cycle === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }
  return nextDate.toISOString();
}

export function parseSubscriptionFeatures(featuresStr: string) {
  try {
    return JSON.parse(featuresStr);
  } catch {
    return defaultSubscription.features;
  }
}