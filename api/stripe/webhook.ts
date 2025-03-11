// api/stripe/webhook.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { db } from '../../src/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Stripe with the latest API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Type guard for better error handling
function isStripeError(error: unknown): error is Stripe.errors.StripeError {
  return error instanceof Error && 'type' in error;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    return res.status(400).json({ message: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody || req.body,
      sig,
      webhookSecret
    );
    
    console.log('Webhook event received:', event.type);
  } catch (err) {
    const message = isStripeError(err) ? err.message : 'Invalid signature';
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ message });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerEmail = session.customer_email;

        if (!userId && !customerEmail) {
          throw new Error('Missing required metadata');
        }

        // For guest checkout, we might not have a userId yet
        // In that case, we'll create a new user record when they sign up
        if (userId) {
          // Update subscription in Firestore
          const subscriptionRef = db.collection('subscriptions').doc(userId);
          
          await subscriptionRef.set({
            user_id: userId,
            status: 'active',
            plan: session.metadata?.plan || 'basic',
            billing_cycle: session.metadata?.billing_cycle || 'monthly',
            price_id: session.metadata?.price_id,
            customer_id: session.customer as string,
            start_date: Timestamp.fromDate(new Date()),
            next_billing_date: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            updated_at: Timestamp.fromDate(new Date()),
            created_at: Timestamp.fromDate(new Date())
          }, { merge: true });

          // Update user profile if needed
          if (customerEmail) {
            const userProfileRef = db.collection('user_profiles').doc(userId);
            await userProfileRef.set({
              user_id: userId,
              email: customerEmail,
              updated_at: Timestamp.fromDate(new Date())
            }, { merge: true });
          }
        } else if (customerEmail) {
          // Store pending subscription for guest checkout
          // This will be associated with the user when they sign up
          const pendingSubscriptionRef = db.collection('pending_subscriptions').doc();
          await pendingSubscriptionRef.set({
            email: customerEmail,
            status: 'pending',
            plan: session.metadata?.plan || 'basic',
            customer_id: session.customer as string,
            session_id: session.id,
            created_at: Timestamp.fromDate(new Date())
          });
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        if (!invoice.lines.data[0]?.period?.end) {
          throw new Error('Missing period end date');
        }

        // Find subscription by customer ID
        const subscriptionsSnapshot = await db.collection('subscriptions')
          .where('customer_id', '==', customerId)
          .limit(1)
          .get();

        if (!subscriptionsSnapshot.empty) {
          const subscriptionDoc = subscriptionsSnapshot.docs[0];
          await subscriptionDoc.ref.update({
            next_billing_date: Timestamp.fromDate(new Date(invoice.lines.data[0].period.end * 1000)),
            updated_at: Timestamp.fromDate(new Date())
          });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find subscription by customer ID
        const subscriptionsSnapshot = await db.collection('subscriptions')
          .where('customer_id', '==', customerId)
          .limit(1)
          .get();

        if (!subscriptionsSnapshot.empty) {
          const subscriptionDoc = subscriptionsSnapshot.docs[0];
          await subscriptionDoc.ref.update({
            status: 'canceled',
            cancellation_date: Timestamp.fromDate(new Date()),
            updated_at: Timestamp.fromDate(new Date())
          });
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return res.status(500).json({
      message: 'Internal server error',
      error: isStripeError(err) ? err.message : 'Unknown error'
    });
  }
}
