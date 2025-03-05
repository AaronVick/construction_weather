// src/hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { useFirebaseAuth } from './useFirebaseAuth';
import { db } from '../lib/firebaseClient';
import { Subscription } from '../types/subscription';
import { defaultSubscription } from '../defaults/subscriptionDefaults';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function useSubscription() {
  const { user } = useFirebaseAuth();
  const [subscription, setSubscription] = useState<Subscription>(defaultSubscription);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        if (!user?.uid) return;

        const subscriptionsQuery = query(
          collection(db, 'subscriptions'),
          where('user_id', '==', user.uid)
        );

        const querySnapshot = await getDocs(subscriptionsQuery);
        
        if (querySnapshot.empty) {
          console.log('No subscription found for user');
          setLoading(false);
          return;
        }

        // Get the first subscription document
        const subscriptionDoc = querySnapshot.docs[0];
        const data = subscriptionDoc.data();

        if (data) {
          // Transform to match our Subscription type
          const transformedData: Subscription = {
            id: subscriptionDoc.id,
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
            payment_method: data.payment_method,
            features: data.features || defaultSubscription.features,
            created_at: data.created_at,
            updated_at: data.updated_at,
            currentPeriodEnd: data.next_billing_date
          };
          setSubscription(transformedData);
        }
      } catch (error) {
        console.error('Error fetching user subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  return { subscription, setSubscription, loading };
}
