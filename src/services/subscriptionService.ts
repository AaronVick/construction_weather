// src/services/subscriptionService.ts

import { supabase } from '../lib/supabaseClient';
import { formatPaymentMethod } from '../utils/subscriptionHelpers';
import { 
  Subscription,
  PaymentMethod,
  PaymentMethodData,
  BillingHistoryItem,
  SubscriptionFeatures,
  SubscriptionPlan,
  SubscriptionStatus
} from '../types/subscription';

/**
 * Fetch the current user's subscription details
 */
export async function getSubscriptionDetails(): Promise<Subscription> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    return formatSubscription(data);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw new Error('Failed to retrieve subscription details');
  }
}

/**
 * Updates the user's subscription plan
 */
export async function updateSubscriptionPlan(plan: SubscriptionPlan): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        plan,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Failed to update subscription plan');
  }
}

/**
 * Fetch the user's billing history
 */
export async function getBillingHistory(): Promise<BillingHistoryItem[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('billing_history')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) throw error;

    return data.map(formatBillingHistory);
  } catch (error) {
    console.error('Error fetching billing history:', error);
    throw new Error('Failed to retrieve billing history');
  }
}

/**
 * Fetch the user's payment method details
 */
export async function getPaymentMethod(): Promise<PaymentMethod | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (error) throw error;

    return data ? formatPaymentMethod(data) : null;
  } catch (error) {
    console.error('Error fetching payment method:', error);
    throw new Error('Failed to retrieve payment method');
  }
}

/**
 * Cancels the user's subscription
 */
export async function cancelSubscription(): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled' as SubscriptionStatus,
        cancellation_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

/**
 * Default subscription features
 */
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

/**
 * Formats subscription data from Supabase
 */
function formatSubscription(data: any): Subscription {
  return {
    id: data.id,
    user_id: data.user_id,
    plan: data.plan,
    status: data.status,
    billing_cycle: data.billing_cycle,
    price_id: data.price_id,
    customer_id: data.customer_id,
    start_date: data.start_date,
    end_date: data.end_date,
    trial_end: data.trial_end,
    next_billing_date: data.next_billing_date,
    cancellation_date: data.cancellation_date,
    payment_method: formatPaymentMethod(data.payment_method),
    features: typeof data.features === 'string' 
      ? parseSubscriptionFeatures(data.features)
      : data.features || defaultFeatures,
    created_at: data.created_at,
    updated_at: data.updated_at,
    currentPeriodEnd: data.next_billing_date
  };
}

/**
 * Parses features stored as a string (JSON in the DB) and converts it to an object
 */
function parseSubscriptionFeatures(features: string): SubscriptionFeatures {
  try {
    const parsedFeatures = JSON.parse(features);
    return {
      ...defaultFeatures,
      ...parsedFeatures
    };
  } catch {
    console.warn('Invalid subscription features format. Falling back to default.');
    return defaultFeatures;
  }
}

/**
 * Formats billing history data
 */
function formatBillingHistory(data: any): BillingHistoryItem {
  return {
    id: data.id,
    date: data.date,
    description: data.description,
    amount: data.amount,
    status: data.status,
    invoice: data.invoice || null,
    invoiceUrl: data.invoiceUrl || null
  };
}