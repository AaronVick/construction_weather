// src/api/stripe/create-guest-checkout.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, billingCycle = 'monthly' } = req.body;
    console.log('Received request for plan:', plan, 'Billing cycle:', billingCycle);

    if (!plan || !PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]) {
      return res.status(400).json({
        error: 'Invalid plan',
        message: 'Please select a valid subscription plan'
      });
    }

    // Validate billing cycle
    if (billingCycle !== 'monthly' && billingCycle !== 'annual') {
      return res.status(400).json({
        error: 'Invalid billing cycle',
        message: 'Billing cycle must be either "monthly" or "annual"'
      });
    }

    // Get the price ID for the selected plan and billing cycle
    const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];
    const priceId = planConfig[billingCycle as keyof typeof planConfig];

    console.log('Selected plan:', plan, 'Billing cycle:', billingCycle, 'Price ID:', priceId);

    if (!priceId) {
      return res.status(500).json({
        error: 'Configuration error',
        message: `Price ID not found for plan: ${plan} with billing cycle: ${billingCycle}. Please contact support.`
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/`,
      metadata: {
        plan,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_creation: 'always',
    });

    console.log('Created checkout session:', session.id);
    return res.status(200).json({ 
      sessionId: session.id,
      message: 'Checkout session created successfully'
    });

  } catch (error) {
    console.error('Error in checkout API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error
    });
  }
}
