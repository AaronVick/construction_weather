// src/services/subscriptionService.ts
import { supabase } from '../src/lib/supabaseClient';
import { Subscription, SubscriptionPlan, BillingCycle, BillingHistory, PlanOption } from '../src/types/subscription';

/**
 * Fetches the current user's subscription details
 */
export async function getSubscriptionDetails(): Promise<Subscription> {
  try {
    // Get user id
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    // Get subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    // If no subscription found, return default values
    if (!data) {
      return {
        id: 'free-tier',
        plan: 'basic',
        status: 'active',
        billingCycle: 'monthly',
        startDate: new Date().toISOString(),
        nextBillingDate: getNextBillingDate('monthly'),
        features: getFeaturesByPlan('basic'),
      };
    }

    return {
      id: data.id,
      plan: data.plan,
      status: data.status,
      billingCycle: data.billing_cycle,
      priceId: data.price_id,
      customerId: data.customer_id,
      startDate: data.start_date,
      endDate: data.end_date,
      trialEnd: data.trial_end,
      nextBillingDate: data.next_billing_date,
      cancellationDate: data.cancellation_date,
      paymentMethod: data.payment_method ? {
        id: data.payment_method.id,
        type: data.payment_method.type,
        last4: data.payment_method.last4,
        brand: data.payment_method.brand,
        expMonth: data.payment_method.exp_month,
        expYear: data.payment_method.exp_year,
        isDefault: data.payment_method.is_default,
      } : undefined,
      features: getFeaturesByPlan(data.plan),
    };
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    throw new Error('Failed to fetch subscription information');
  }
}

/**
 * Updates the user's subscription plan
 */
export async function updateSubscription(
  plan: SubscriptionPlan,
  billingCycle: BillingCycle
): Promise<Subscription> {
  try {
    // In a real implementation, this would interact with Stripe or another payment processor
    // For now, we'll just update the local database
    
    // Get user id
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');
    
    const now = new Date().toISOString();
    const nextBillingDate = getNextBillingDate(billingCycle);
    
    // Check if subscription exists
    const { data: existingSub, error: checkError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    let subscriptionData;
    
    if (existingSub) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          plan,
          billing_cycle: billingCycle,
          status: plan === 'none' ? 'canceled' : 'active',
          updated_at: now,
          next_billing_date: nextBillingDate,
          cancellation_date: plan === 'none' ? now : null,
        })
        .eq('id', existingSub.id)
        .select()
        .single();
        
      if (error) throw error;
      subscriptionData = data;
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan,
          billing_cycle: billingCycle,
          status: 'active',
          start_date: now,
          next_billing_date: nextBillingDate,
        })
        .select()
        .single();
        
      if (error) throw error;
      subscriptionData = data;
    }
    
    // Log billing history
    await logBillingEvent(
      user.id,
      plan === 'none' ? 'Subscription Canceled' : `Subscription Updated to ${plan}`,
      plan === 'none' ? 0 : getPlanPrice(plan, billingCycle),
      plan === 'none' ? 'refunded' : 'paid'
    );
    
    return {
      id: subscriptionData.id,
      plan: subscriptionData.plan,
      status: subscriptionData.status,
      billingCycle: subscriptionData.billing_cycle,
      priceId: subscriptionData.price_id,
      customerId: subscriptionData.customer_id,
      startDate: subscriptionData.start_date,
      endDate: subscriptionData.end_date,
      trialEnd: subscriptionData.trial_end,
      nextBillingDate: subscriptionData.next_billing_date,
      cancellationDate: subscriptionData.cancellation_date,
      paymentMethod: subscriptionData.payment_method,
      features: getFeaturesByPlan(subscriptionData.plan),
    };
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Failed to update subscription');
  }
}

/**
 * Updates the payment method for a subscription
 */
export async function updatePaymentMethod(
  paymentMethodId: string
): Promise<boolean> {
  try {
    // In a real implementation, this would interact with Stripe
    // For now, we'll just simulate success
    
    // Get user id
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');
    
    // Find existing subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (error) throw error;
    if (!subscription) throw new Error('No subscription found');
    
    // Update payment method
    // Note: In a real implementation, you would validate the payment method with Stripe first
    await supabase
      .from('subscriptions')
      .update({
        payment_method: {
          id: paymentMethodId,
          type: 'card',
          last4: '4242', // Simulated data
          brand: 'visa',
          exp_month: 12,
          exp_year: 2030,
          is_default: true,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);
    
    return true;
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw new Error('Failed to update payment method');
  }
}

/**
 * Fetches billing history for the current user
 */
export async function getBillingHistory(): Promise<BillingHistory[]> {
  try {
    // Get user id
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('billing_history')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
      
    if (error) throw error;
    
    return data.map((item: any) => ({
      id: item.id,
      date: item.date,
      amount: item.amount,
      description: item.description,
      status: item.status,
      invoiceUrl: item.invoice_url,
      receiptUrl: item.receipt_url,
    }));
  } catch (error) {
    console.error('Error fetching billing history:', error);
    throw new Error('Failed to fetch billing history');
  }
}

/**
 * Gets available subscription plans
 */
export function getSubscriptionPlans(): PlanOption[] {
  return [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Essential features for small teams and simple workflows',
      pricing: {
        monthly: 9.99,
        annually: 99.99,
      },
      features: [
        'Unlimited clients',
        'Weather-based notifications',
        'Email automation',
        'Single jobsite',
        'Basic support'
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Advanced features for growing businesses',
      pricing: {
        monthly: 24.99,
        annually: 249.99,
      },
      features: [
        'Everything in Basic',
        'Multiple jobsites (up to 10)',
        'Jobsite-specific notifications',
        'Advanced analytics',
        'Priority support',
        'Custom email templates'
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Comprehensive solution for large organizations',
      pricing: {
        monthly: 49.99,
        annually: 499.99,
      },
      features: [
        'Everything in Premium',
        'Unlimited jobsites',
        'Custom workflows',
        'Advanced reporting',
        'Dedicated support',
        'API access',
        'White labeling',
        'SSO authentication'
      ],
    }
  ];
}

/**
 * Generates feature set based on plan
 */
function getFeaturesByPlan(plan: SubscriptionPlan) {
  switch (plan) {
    case 'enterprise':
      return {
        maxJobsites: Infinity,
        maxEmailTemplates: Infinity,
        advancedAnalytics: true,
        customEmails: true,
        prioritySupport: true,
        smsNotifications: true,
        customReports: true,
        apiAccess: true,
        whiteLabeling: true,
        singleSignOn: true,
      };
    case 'premium':
      return {
        maxJobsites: 10,
        maxEmailTemplates: 10,
        advancedAnalytics: true,
        customEmails: true,
        prioritySupport: true,
        smsNotifications: true,
        customReports: false,
        apiAccess: false,
        whiteLabeling: false,
        singleSignOn: false,
      };
    case 'basic':
    default:
      return {
        maxJobsites: 1,
        maxEmailTemplates: 3,
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
 * Gets the price for a plan and billing cycle
 */
function getPlanPrice(plan: SubscriptionPlan, billingCycle: BillingCycle): number {
  const plans = getSubscriptionPlans();
  const planData = plans.find(p => p.id === plan);
  
  if (!planData) return 0;
  
  return planData.pricing[billingCycle];
}

/**
 * Calculates the next billing date based on the billing cycle
 */
function getNextBillingDate(billingCycle: BillingCycle): string {
  const date = new Date();
  
  if (billingCycle === 'annually') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  
  return date.toISOString();
}

/**
 * Logs a billing history event
 */
async function logBillingEvent(
  userId: string,
  description: string,
  amount: number,
  status: 'paid' | 'pending' | 'failed' | 'refunded'
): Promise<void> {
  try {
    await supabase.from('billing_history').insert({
      user_id: userId,
      description,
      amount,
      status,
      date: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging billing event:', error);
    // Non-critical error, so we don't throw
  }
}