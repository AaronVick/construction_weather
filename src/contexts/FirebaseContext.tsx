// src/contexts/FirebaseContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
import { auth } from '../lib/firebaseClient';
import { handleFirebaseError } from '../lib/firebaseClient';

type FirebaseContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: UserCredential | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: UserCredential | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    error: Error | null;
    data: { message: string } | null;
  }>;
  updatePassword: (password: string) => Promise<{
    error: Error | null;
    data: User | null;
  }>;
};

const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        data: userCredential,
        error: null,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        data: null,
        error: error as Error,
      };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return {
        data: userCredential,
        error: null,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        data: null,
        error: error as Error,
      };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        data: { message: 'Password reset email sent' },
        error: null,
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        data: null,
        error: error as Error,
      };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }
      
      await firebaseUpdatePassword(auth.currentUser, password);
      
      return {
        data: auth.currentUser,
        error: null,
      };
    } catch (error) {
      console.error('Update password error:', error);
      return {
        data: null,
        error: error as Error,
      };
    }
  };

  const value: FirebaseContextType = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
