// src/pages/signup.tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import { FirebaseError } from 'firebase/app';

interface SignupFormData {
  email: string;
  password: string;
  fullName: string;
  company: string;
}

const Signup: React.FC = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    fullName: '',
    company: '',
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { signUp, user } = useFirebaseAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Create user in Firebase Auth
      const { data: authData, error: authError } = await signUp(
        formData.email, 
        formData.password
      );

      if (authError) throw authError;
      if (!authData?.user) throw new Error('No user data returned');

      // Create user profile in Firestore
      await setDoc(doc(db, 'user_profiles', authData.user.uid), {
        user_id: authData.user.uid,
        full_name: formData.fullName,
        company: formData.company,
        email: formData.email,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Check for pending subscriptions
      const pendingSubscriptionsRef = collection(db, 'pending_subscriptions');
      const pendingSubscriptionsQuery = query(
        pendingSubscriptionsRef,
        where('email', '==', formData.email),
        where('status', '==', 'pending')
      );
      const pendingSubscriptionsSnapshot = await getDocs(pendingSubscriptionsQuery);

      if (!pendingSubscriptionsSnapshot.empty) {
        const pendingSubscription = pendingSubscriptionsSnapshot.docs[0].data();
        
        // Create subscription record
        await setDoc(doc(db, 'subscriptions', authData.user.uid), {
          user_id: authData.user.uid,
          status: 'active',
          plan: pendingSubscription.plan || 'basic',
          customer_id: pendingSubscription.customer_id,
          start_date: serverTimestamp(),
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        
        // Update pending subscription status
        await setDoc(pendingSubscriptionsSnapshot.docs[0].ref, {
          status: 'completed',
          user_id: authData.user.uid,
          updated_at: serverTimestamp()
        });
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Signup error:', err);
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during signup');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <input
                id="company"
                name="company"
                type="text"
                autoComplete="organization"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Company (Optional)"
                value={formData.company}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
