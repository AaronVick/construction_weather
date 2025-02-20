// src/types/supabase.ts

export type Database = {
  auth: {
    Tables: {
      audit_log_entries: {};
      flow_state: {};
      identities: {};
      instances: {};
      mfa_amr_claims: {};
      mfa_challenges: {};
      mfa_factors: {};
      one_time_tokens: {};
      refresh_tokens: {};
      saml_providers: {};
      saml_relay_states: {};
      schema_migrations: {};
      sessions: {};
      sso_domains: {};
      sso_providers: {};
      users: {};
    };
  };
  extensions: {
    Tables: {
      pg_stat_statements: {};
      pg_stat_statements_info: {};
    };
  };
  pgsodium: {
    Tables: {
      decrypted_key: {};
      key: {};
      mask_columns: {};
      masking_rule: {};
      valid_key: {};
    };
  };
  public: {
    Tables: {
      analytics_data: {};
      billing_history: {};
      clients: {};
      email_logs: {};
      geography_columns: {};
      geometry_columns: {};
      spatial_ref_sys: {};
      user_profiles: {};
      weather_checks: {};

      // ✅ Workers Table
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

      // ✅ Jobsites Table
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

      // ✅ Worker-Jobsite Relationship Table
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

      // ✅ Email Templates Table
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

      // ✅ System Settings Table
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

      // ✅ Subscriptions Table
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
    };
  };
};
