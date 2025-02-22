// src/hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { supabase } from '../lib/supabaseClient';
import { Subscription } from '../types/subscription';
import { defaultSubscription } from '../defaults/subscriptionDefaults';

export function useSubscription() {
  const { user } = useSupabaseAuth();
  const [subscription, setSubscription] = useState<Subscription>(defaultSubscription);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        if (!user?.id) return;

        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching subscription:', error);
          return;
        }

        if (data) {
          // Transform the data to match our Subscription type
          const transformedData: Subscription = {
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
            payment_method: data.payment_method,
            features: data.features || defaultSubscription.features,
            created_at: data.created_at,
            updated_at: data.updated_at,
            currentPeriodEnd: data.next_billing_date
          };
          setSubscription(transformedData);
        }
      } catch (error) {
        console.error('Error in subscription hook:', error);
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