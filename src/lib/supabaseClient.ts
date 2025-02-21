// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_API;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'weather-crew',
    },
  },
});

// Helper to handle common Supabase error patterns
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  // For authentication errors
  if (error?.message?.includes('email') || error?.message?.includes('password')) {
    return {
      message: error.message,
      field: error.message.includes('email') ? 'email' : 'password',
    };
  }
  
  // For database errors
  if (error?.code === '23505') {
    return {
      message: 'This record already exists.',
      field: 'duplicate',
    };
  }
  
  // For constraint errors
  if (error?.code === '23503') {
    return {
      message: 'This operation violates a constraint. Make sure related records exist.',
      field: 'constraint',
    };
  }
  
  // For permission errors
  if (error?.code === '42501' || error?.code === '3F000') {
    return {
      message: 'You don\'t have permission to perform this action.',
      field: 'permission',
    };
  }
  
  // Default error
  return {
    message: error?.message || error?.error_description || 'An unknown error occurred',
    field: null,
  };
};