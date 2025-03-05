// api/stripe/validate-checkout.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { db } from '../lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ message: 'Missing session_id parameter' });
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer', 'subscription']
    });

    if (!session) {
      return res.status(404).json({ message: 'Checkout session not found' });
    }

    // Check if the session was completed
    if (session.status !== 'complete') {
      return res.status(400).json({ 
        message: 'Checkout session is not complete',
        status: session.status
      });
    }

    // Check if there's a pending subscription in Firestore
    const pendingSubscriptionsSnapshot = await db.collection('pending_subscriptions')
      .where('session_id', '==', session_id)
      .limit(1)
      .get();

    let pendingSubscription = null;
    if (!pendingSubscriptionsSnapshot.empty) {
      pendingSubscription = pendingSubscriptionsSnapshot.docs[0].data();
    }

    // Return the checkout data
    return res.status(200).json({
      customer_email: session.customer_email,
      customer_id: session.customer as string,
      subscription_id: (session.subscription as Stripe.Subscription)?.id || null,
      payment_status: session.payment_status,
      plan: session.metadata?.plan || pendingSubscription?.plan || 'basic',
      billing_cycle: session.metadata?.billing_cycle || 'monthly',
      session_id: session.id,
      status: 'success'
    });
  } catch (error) {
    console.error('Error validating checkout session:', error);
    return res.status(500).json({ 
      message: 'Error validating checkout session',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
