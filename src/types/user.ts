// src/types/user.ts

export interface UserProfile {
  id?: string;
  user_id: string;
  email: string;
  full_name: string;
  zip_code?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserProfileFormData {
  full_name: string;
  email: string;
  zip_code: string;
}

export interface UserSettingsFormState {
  full_name: string;
  email: string;
  zip_code: string;
  isLoading: boolean;
  error?: string;
  success?: string;
}