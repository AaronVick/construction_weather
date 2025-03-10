// src/components/Checkout.tsx


import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { auth } from '../lib/firebaseClient';
import { XCircle } from 'lucide-react'; // Import an icon for the close button

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface CheckoutProps {
  priceId: string;
  email?: string;
  plan: string;
  billingCycle: string;
  onClose: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ priceId, email, plan, billingCycle, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createCheckoutSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the current user's ID
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        // Create a Stripe Checkout session
        const response = await fetch('/api/consolidated/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId,
            email: email || currentUser.email,
            userId: currentUser.uid,
            plan,
            billingCycle,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create checkout session');
        }

        const { sessionId } = await response.json();
        console.log('Checkout session created:', sessionId);

        // Redirect to Stripe Checkout
        const stripe = await stripePromise;
        if (!stripe) throw new Error('Stripe failed to initialize');

        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
        if (stripeError) throw stripeError;
      } catch (error) {
        console.error('Error creating checkout session:', error);
        setError('Failed to redirect to checkout. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    createCheckoutSession();
  }, [priceId, email, plan, billingCycle]);

  return (
    <div className="checkout-modal">
      <div className="checkout-content">
        {/* Close Button */}
        <button className="close-button" onClick={onClose}>
          <XCircle size={24} />
        </button>

        {/* Loading State */}
        {isLoading && <p>Redirecting to Stripe Checkout...</p>}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
