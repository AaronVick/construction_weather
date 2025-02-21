// src/vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_API: string;
    readonly VITE_OPENAI_API_KEY: string;
    readonly VITE_WEATHER_API_KEY: string;
    readonly VITE_STRIPE_PUBLIC_KEY: string;
    readonly VITE_APP_URL: string;
    readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
    readonly VITE_ENABLE_ANALYTICS: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }