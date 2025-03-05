// src/services/subscriptionService.ts
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebaseClient';
import { Subscription, SubscriptionPlan } from '../types/subscription';

/**
 * Get subscription details for the current user
 * This is the main function used by the SubscriptionContext
 */
export async function getSubscriptionDetails(): Promise<Subscription> {
  try {
    const subscription = await getUserSubscription();
    
    if (subscription) {
      return subscription;
    }
    
    // Return default subscription if none found
    return {
      id: '',
      user_id: auth.currentUser?.uid || '',
      customer_id: null,
      price_id: null,
      plan: 'none',
      status: 'incomplete',
      billing_cycle: 'monthly',
      start_date: '',
      end_date: '',
      trial_end: '',
      next_billing_date: '',
      cancellation_date: '',
      payment_method: null,
      features: {
        maxJobsites: 1,
        maxEmailTemplates: 1,
        advancedAnalytics: false,
        customEmails: false,
        prioritySupport: false,
        smsNotifications: false,
        customReports: false,
        apiAccess: false,
        whiteLabeling: false,
        singleSignOn: false
      },
      created_at: '',
      updated_at: '',
      currentPeriodEnd: ''
    };
  } catch (error) {
    console.error('Error in getSubscriptionDetails:', error);
    throw error;
  }
}

/**
 * Get the current user's subscription
 */
export async function getUserSubscription(): Promise<Subscription | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('user_id', '==', user.uid)
    );
    
    const querySnapshot = await getDocs(subscriptionsQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Get the first subscription (there should only be one per user)
    const subscriptionDoc = querySnapshot.docs[0];
    return formatSubscription({
      id: subscriptionDoc.id,
      ...subscriptionDoc.data()
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
}

/**
 * Create a new subscription
 */
export async function createSubscription(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const subscriptionData = {
      ...subscription,
      user_id: user.uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData);
    
    // Get the newly created document
    const newSubscriptionDoc = await getDoc(docRef);
    if (!newSubscriptionDoc.exists()) {
      throw new Error('Failed to retrieve created subscription');
    }
    
    return formatSubscription({
      id: newSubscriptionDoc.id,
      ...newSubscriptionDoc.data()
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return null;
  }
}

/**
 * Update a subscription
 */
export async function updateSubscription(
  id: string,
  updates: Partial<Omit<Subscription, 'id' | 'created_at' | 'updated_at'>>
): Promise<Subscription | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const subscriptionRef = doc(db, 'subscriptions', id);
    
    // Verify ownership before update
    const subscriptionDoc = await getDoc(subscriptionRef);
    if (!subscriptionDoc.exists()) {
      throw new Error('Subscription not found');
    }
    
    if (subscriptionDoc.data().user_id !== user.uid) {
      throw new Error('Unauthorized to update this subscription');
    }
    
    await updateDoc(subscriptionRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(subscriptionRef);
    if (!updatedDoc.exists()) {
      throw new Error('Subscription not found after update');
    }
    
    return formatSubscription({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return null;
  }
}

/**
 * Update subscription plan
 */
export async function updateSubscriptionPlan(
  plan: string,
  billingCycle: string = 'monthly'
): Promise<Subscription | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Get current subscription
    const subscription = await getUserSubscription();
    
    if (!subscription) {
      throw new Error('No subscription found to update');
    }
    
    // Update the subscription with new plan details
    return updateSubscription(subscription.id, {
      plan: plan as SubscriptionPlan,
      billing_cycle: billingCycle as 'monthly' | 'annually'
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return null;
  }
}

/**
 * Get billing history for the current user
 */
export async function getBillingHistory(): Promise<any[]> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Query the billing_history collection
    const historyQuery = query(
      collection(db, 'billing_history'),
      where('user_id', '==', user.uid),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(historyQuery);
    
    const history: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
        description: data.description,
        amount: data.amount,
        status: data.status,
        invoice: data.invoice || null,
        invoiceUrl: data.invoiceUrl || null
      });
    });
    
    return history;
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return [];
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(id: string): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const subscriptionRef = doc(db, 'subscriptions', id);
    
    // Verify ownership before cancellation
    const subscriptionDoc = await getDoc(subscriptionRef);
    if (!subscriptionDoc.exists()) {
      throw new Error('Subscription not found');
    }
    
    if (subscriptionDoc.data().user_id !== user.uid) {
      throw new Error('Unauthorized to cancel this subscription');
    }
    
    await updateDoc(subscriptionRef, {
      status: 'canceled',
      cancellation_date: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}

/**
 * Helper function to format subscription data
 */
function formatSubscription(data: any): Subscription {
  // Convert Firestore Timestamps to ISO strings
  const created_at = data.created_at instanceof Timestamp 
    ? data.created_at.toDate().toISOString() 
    : data.created_at;
    
  const updated_at = data.updated_at instanceof Timestamp 
    ? data.updated_at.toDate().toISOString() 
    : data.updated_at;
    
  const start_date = data.start_date instanceof Timestamp 
    ? data.start_date.toDate().toISOString() 
    : data.start_date;
    
  const end_date = data.end_date instanceof Timestamp 
    ? data.end_date.toDate().toISOString() 
    : data.end_date;
    
  const trial_end = data.trial_end instanceof Timestamp 
    ? data.trial_end.toDate().toISOString() 
    : data.trial_end;
    
  const next_billing_date = data.next_billing_date instanceof Timestamp 
    ? data.next_billing_date.toDate().toISOString() 
    : data.next_billing_date;
    
  const cancellation_date = data.cancellation_date instanceof Timestamp 
    ? data.cancellation_date.toDate().toISOString() 
    : data.cancellation_date;

  return {
    id: data.id,
    user_id: data.user_id,
    customer_id: data.customer_id || null,
    price_id: data.price_id || null,
    plan: data.plan as SubscriptionPlan,
    status: data.status,
    billing_cycle: data.billing_cycle || 'monthly',
    start_date,
    end_date,
    trial_end,
    next_billing_date,
    cancellation_date,
    payment_method: data.payment_method || null,
    features: data.features || {
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
    created_at,
    updated_at,
    currentPeriodEnd: data.currentPeriodEnd || next_billing_date || end_date || '',
  };
}
