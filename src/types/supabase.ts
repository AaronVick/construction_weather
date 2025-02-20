// src/types/supabase.ts
import { SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseClientOptions {
  auth?: {
    autoRefreshToken?: boolean;
    persistSession?: boolean;
    detectSessionInUrl?: boolean;
  };
  global?: {
    headers?: Record<string, string>;
    fetch?: typeof fetch;
  };
  realtime?: {
    eventsPerSecond?: number;
    timeout?: number;
  };
  db?: {
    schema?: string;
  };
}

export interface Database extends SupabaseDatabase {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          address: string | null;
          company_name: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          address?: string | null;
          company_name?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          address?: string | null;
          company_name?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      workers: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          role: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          role?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          role?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      jobsites: {
        Row: {
          id: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          client_id: string;
          weather_monitoring: {
            enabled: boolean;
            conditions: string[];
            threshold: number;
            notification_settings: {
              notify_client: boolean;
              notify_workers: boolean;
            };
          };
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          client_id: string;
          weather_monitoring?: {
            enabled: boolean;
            conditions: string[];
            threshold: number;
            notification_settings: {
              notify_client: boolean;
              notify_workers: boolean;
            };
          };
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          client_id?: string;
          weather_monitoring?: {
            enabled: boolean;
            conditions: string[];
            threshold: number;
            notification_settings: {
              notify_client: boolean;
              notify_workers: boolean;
            };
          };
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      worker_jobsites: {
        Row: {
          worker_id: string;
          jobsite_id: string;
          created_at: string;
        };
        Insert: {
          worker_id: string;
          jobsite_id: string;
          created_at?: string;
        };
        Update: {
          worker_id?: string;
          jobsite_id?: string;
          created_at?: string;
        };
      };
      email_logs: {
        Row: {
          id: string;
          client_id: string | null;
          worker_id: string | null;
          subject: string;
          body: string;
          recipient_email: string;
          recipient_name: string;
          status: string;
          trigger: string;
          weather_condition: string | null;
          error_message: string | null;
          scheduled_for: string | null;
          sent_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          worker_id?: string | null;
          subject: string;
          body: string;
          recipient_email: string;
          recipient_name: string;
          status: string;
          trigger: string;
          weather_condition?: string | null;
          error_message?: string | null;
          scheduled_for?: string | null;
          sent_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          worker_id?: string | null;
          subject?: string;
          body?: string;
          recipient_email?: string;
          recipient_name?: string;
          status?: string;
          trigger?: string;
          weather_condition?: string | null;
          error_message?: string | null;
          scheduled_for?: string | null;
          sent_at?: string;
          created_at?: string;
        };
      };
      email_templates: {
        Row: {
          id: string;
          name: string;
          subject: string;
          body: string;
          variables: string[];
          created_at: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject: string;
          body: string;
          variables?: string[];
          created_at?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject?: string;
          body?: string;
          variables?: string[];
          created_at?: string;
          updated_at?: string | null;
          user_id?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          status: string;
          billing_cycle: string;
          price_id: string | null;
          customer_id: string | null;
          start_date: string;
          end_date: string | null;
          trial_end: string | null;
          next_billing_date: string;
          cancellation_date: string | null;
          payment_method: any | null;
          updated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: string;
          status: string;
          billing_cycle: string;
          price_id?: string | null;
          customer_id?: string | null;
          start_date?: string;
          end_date?: string | null;
          trial_end?: string | null;
          next_billing_date: string;
          cancellation_date?: string | null;
          payment_method?: any | null;
          updated_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: string;
          status?: string;
          billing_cycle?: string;
          price_id?: string | null;
          customer_id?: string | null;
          start_date?: string;
          end_date?: string | null;
          trial_end?: string | null;
          next_billing_date?: string;
          cancellation_date?: string | null;
          payment_method?: any | null;
          updated_at?: string | null;
          created_at?: string;
        };
      };
      billing_history: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          description: string;
          amount: number;
          status: string;
          invoice_url: string | null;
          receipt_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          description: string;
          amount: number;
          status: string;
          invoice_url?: string | null;
          receipt_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          description?: string;
          amount?: number;
          status?: string;
          invoice_url?: string | null;
          receipt_url?: string | null;
          created_at?: string;
        };
      };
      system_settings: {
        Row: {
          id: string;
          user_id: string;
          email_config: {
            sender_name: string;
            sender_email: string;
            tone: string;
            include_weather_details: boolean;
            subject_template: string;
            body_template: string;
            temperature: number;
            max_tokens: number;
            additional_instructions: string;
          };
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_config: {
            sender_name: string;
            sender_email: string;
            tone: string;
            include_weather_details: boolean;
            subject_template: string;
            body_template: string;
            temperature: number;
            max_tokens: number;
            additional_instructions: string;
          };
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_config?: {
            sender_name: string;
            sender_email: string;
            tone: string;
            include_weather_details: boolean;
            subject_template: string;
            body_template: string;
            temperature: number;
            max_tokens: number;
            additional_instructions: string;
          };
          created_at?: string;
          updated_at?: string | null;
        };
      };
    };
  };
}