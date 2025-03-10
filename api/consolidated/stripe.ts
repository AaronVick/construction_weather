// api/consolidated/stripe.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../lib/firebaseAdmin';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

/**
 * Consolidated API endpoint for Stripe functions
 * 
 * Routes:
 * - POST /api/consolidated/stripe/create-checkout-session
 * - POST /api/consolidated/stripe/create-guest-checkout
 * - GET /api/consolidated/stripe/validate-checkout
 * - POST /api/consolidated/stripe/webhook
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Extract the route from the URL
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const path = url.pathname;
    const route = path.split('/').pop();

    // Route the request to the appropriate handler
    switch (route) {
      case 'create-checkout-session':
        return handleCreateCheckoutSession(req, res);
      case 'create-guest-checkout':
        return handleCreateGuestCheckout(req, res);
      case 'validate-checkout':
        return handleValidateCheckout(req, res);
      case 'webhook':
        return handleWebhook(req, res);
      default:
        return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error('Error in Stripe API:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to create a Stripe checkout session for authenticated users
 */
async function handleCreateCheckoutSession(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization token from the request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get the user
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get user data
    const userRecord = await auth.getUser(userId);
    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get request body
    const { priceId, successUrl, cancelUrl } = req.body;
    
    if (!priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userRecord.email,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    });
    
    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to create a Stripe checkout session for guest users
 */
async function handleCreateGuestCheckout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get request body
    const { priceId, email, successUrl, cancelUrl } = req.body;
    
    if (!priceId || !email || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: {
        isGuest: 'true',
        email,
      },
    });
    
    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating guest checkout session:', error);
    
    return res.status(500).json({ 
      error: 'Failed to create guest checkout session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to validate a Stripe checkout session
 */
async function handleValidateCheckout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId as string);
    
    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }
    
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    // Get product details
    const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);
    
    return res.status(200).json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
      },
      customer: {
        id: session.customer as string,
        email: session.customer_details?.email,
      },
    });
  } catch (error) {
    console.error('Error validating checkout session:', error);
    
    return res.status(500).json({ 
      error: 'Failed to validate checkout session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to handle Stripe webhooks
 */
async function handleWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }
  
  let event;
  
  try {
    // Get raw body
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const rawBody = buffer.toString('utf8');
    
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }
  
  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get user ID from metadata
        const userId = session.metadata?.userId;
        const isGuest = session.metadata?.isGuest === 'true';
        
        if (userId) {
          // Update user subscription status in Firestore
          await db.collection('user_profiles').doc(userId).update({
            subscription: {
              status: 'active',
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });
          
          console.log(`Updated subscription for user ${userId}`);
        } else if (isGuest && session.customer_details?.email) {
          // Store guest subscription in Firestore
          await db.collection('guest_subscriptions').add({
            email: session.customer_details.email,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          console.log(`Created guest subscription for ${session.customer_details.email}`);
        }
        
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user with this subscription ID
        const userSnapshot = await db.collection('user_profiles')
          .where('subscription.stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();
        
        if (!userSnapshot.empty) {
          const userId = userSnapshot.docs[0].id;
          
          // Update subscription status
          await db.collection('user_profiles').doc(userId).update({
            'subscription.status': subscription.status,
            'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
            'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000).toISOString(),
            'subscription.updatedAt': new Date().toISOString(),
          });
          
          console.log(`Updated subscription status for user ${userId} to ${subscription.status}`);
        } else {
          // Check guest subscriptions
          const guestSnapshot = await db.collection('guest_subscriptions')
            .where('stripeSubscriptionId', '==', subscription.id)
            .limit(1)
            .get();
          
          if (!guestSnapshot.empty) {
            const guestId = guestSnapshot.docs[0].id;
            
            // Update guest subscription status
            await db.collection('guest_subscriptions').doc(guestId).update({
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
              updatedAt: new Date().toISOString(),
            });
            
            console.log(`Updated guest subscription status to ${subscription.status}`);
          }
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user with this subscription ID
        const userSnapshot = await db.collection('user_profiles')
          .where('subscription.stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();
        
        if (!userSnapshot.empty) {
          const userId = userSnapshot.docs[0].id;
          
          // Update subscription status
          await db.collection('user_profiles').doc(userId).update({
            'subscription.status': 'canceled',
            'subscription.canceledAt': new Date().toISOString(),
            'subscription.updatedAt': new Date().toISOString(),
          });
          
          console.log(`Marked subscription as canceled for user ${userId}`);
        } else {
          // Check guest subscriptions
          const guestSnapshot = await db.collection('guest_subscriptions')
            .where('stripeSubscriptionId', '==', subscription.id)
            .limit(1)
            .get();
          
          if (!guestSnapshot.empty) {
            const guestId = guestSnapshot.docs[0].id;
            
            // Update guest subscription status
            await db.collection('guest_subscriptions').doc(guestId).update({
              status: 'canceled',
              canceledAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            
            console.log(`Marked guest subscription as canceled`);
          }
        }
        
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    
    return res.status(500).json({ 
      error: 'Failed to handle webhook event',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
