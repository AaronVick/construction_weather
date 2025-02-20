// src/hooks/useSupabaseAuth.ts
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        setAuthState({
          user: data?.session?.user ?? null,
          session: data?.session,
          loading: false,
          error: null,
        });
      } catch (error) {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: error as Error,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        });
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { user: data.user, error: null };
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
      return { user: null, error: error as Error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        throw error;
      }

      return { user: data.user, error: null };
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
      return { user: null, error: error as Error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
      return { error: error as Error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
      return { error: error as Error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
      return { error: error as Error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const updateProfile = async (userData: any) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.updateUser({
        data: userData,
      });

      if (error) {
        throw error;
      }

      setAuthState(prev => ({
        ...prev, 
        user: data.user,
        loading: false,
        error: null,
      }));

      return { user: data.user, error: null };
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
      return { user: null, error: error as Error };
    }
  };

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };
}