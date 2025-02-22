// src/services/subscriptionService.ts


import { supabase } from '../lib/supabaseClient';
import { Subscription, SubscriptionFeatures } from '../types/subscription';
import { formatPaymentMethodForSubscription } from '../utils/subscriptionHelpers';


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
export async function updateSubscriptionPlan(plan: string): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('subscriptions')
      .update({ plan })
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
export async function getBillingHistory(): Promise<BillingHistory[]> {
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
      .update({ status: 'canceled', cancellation_date: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

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
    payment_method: formatPaymentMethodForSubscription(data.payment_method),
    features: typeof data.features === 'string' ? JSON.parse(data.features) : data.features,
    created_at: data.created_at,
    updated_at: data.updated_at,
    currentPeriodEnd: data.next_billing_date
  };
}

/**
 * Parses features stored as a string (JSON in the DB) and converts it to an object.
 */
function parseSubscriptionFeatures(features: string): SubscriptionFeatures {
  try {
    return JSON.parse(features);
  } catch {
    console.warn('Invalid subscription features format. Falling back to default.');
    return {
      maxJobsites: 0,
      maxEmailTemplates: 0,
      advancedAnalytics: false,
      customEmails: false,
      prioritySupport: false,
      smsNotifications: false,
      customReports: false,
      apiAccess: false,
      whiteLabeling: false,
      singleSignOn: false,
    };
  }
}


/**
 * Formats subscription features data
 */
function formatSubscriptionFeatures(data: any): SubscriptionFeatures {
  return {
    maxJobsites: data.maxJobsites || 0,
    maxEmailTemplates: data.maxEmailTemplates || 0,
    advancedAnalytics: data.advancedAnalytics || false,
    customEmails: data.customEmails || false,
    prioritySupport: data.prioritySupport || false,
    smsNotifications: data.smsNotifications || false,
    customReports: data.customReports || false,
    apiAccess: data.apiAccess || false,
    whiteLabeling: data.whiteLabeling || false,
    singleSignOn: data.singleSignOn || false
  };
}

/**
 * Formats billing history data
 */
function formatBillingHistory(data: any): BillingHistory {
  return {
    id: data.id,
    date: data.date,
    description: data.description,
    amount: data.amount,
    status: data.status,
    invoice: data.invoice || '',
    invoiceUrl: data.invoiceUrl || ''
  };
}

/**
 * Formats payment method data
 */
function formatPaymentMethod(data: any): PaymentMethod {
  return {
    id: data.id,
    type: data.type,
    last4: data.last4 || '',
    brand: data.brand || '',
    expMonth: data.expMonth || 0,
    expYear: data.expYear || 0,
    isDefault: data.isDefault
  };
}
