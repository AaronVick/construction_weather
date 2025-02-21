// src/hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { supabase } from '../lib/supabaseClient';

interface Subscription {
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodEnd: string;
}

export function useSubscription() {
  const { user } = useSupabaseAuth();
  const [subscription, setSubscription] = useState<Subscription>({
    plan: 'basic',
    status: 'active',
    currentPeriodEnd: new Date().toISOString()
  });
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
          setSubscription(data);
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

  return { subscription, loading };
}