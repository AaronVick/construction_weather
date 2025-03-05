// api/stripe/create-checkout-session.ts

import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Initialize Stripe with the latest API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

// Define price IDs from environment variables
// These should be set in Vercel environment variables
const PLAN_CONFIG = {
  basic: {
    monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
    annual: process.env.STRIPE_BASIC_ANNUAL_PRICE_ID
  },
  premium: {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID
  },
  enterprise: {
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    annual: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID
  }
};

// Debug log to check environment variables
console.log('Environment variables check:', {
  basic: {
    monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID ? 'set' : 'not set',
    annual: process.env.STRIPE_BASIC_ANNUAL_PRICE_ID ? 'set' : 'not set'
  },
  premium: {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ? 'set' : 'not set',
    annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID ? 'set' : 'not set'
  },
  enterprise: {
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ? 'set' : 'not set',
    annual: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID ? 'set' : 'not set'
  }
});

export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, email, plan, billingCycle } = req.body;

  try {
    if (!plan || !PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]) {
      return res.status(400).json({
        error: 'Invalid plan',
        message: 'Please select a valid subscription plan'
      });
    }

    // Get the billing cycle (default to monthly if not specified)
    const cycle = billingCycle || 'monthly';
    if (cycle !== 'monthly' && cycle !== 'annual') {
      return res.status(400).json({
        error: 'Invalid billing cycle',
        message: 'Billing cycle must be either "monthly" or "annual"'
      });
    }

    // Get the price ID for the selected plan and billing cycle
    const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];
    const priceId = planConfig[cycle as keyof typeof planConfig];

    console.log('Selected plan:', plan, 'Billing cycle:', cycle, 'Price ID:', priceId);

    if (!priceId) {
      return res.status(500).json({
        error: 'Configuration error',
        message: `Price ID not found for plan: ${plan} with billing cycle: ${cycle}. Please contact support.`
      });
    }

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/cancel`,
      metadata: {
        userId,
        plan,
        billing_cycle: billingCycle,
        price_id: priceId,
      },
      customer_email: email,
    });

    console.log('Stripe Checkout session created:', session.id);
    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating Stripe Checkout session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
