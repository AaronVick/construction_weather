// src/components/settings/types.ts

export interface UserProfile {
  id?: string;
  user_id: string;
  full_name?: string;
  zip_code?: string;
  notification_channels?: {
    email: boolean;
    summary: boolean;
    marketing: boolean;
  };
  preferences?: {
    time_format: '12h' | '24h';
    temp_unit: 'F' | 'C';
    language: string;
  };
  created_at?: any;
  updated_at?: any;
}

export interface SettingsFormData {
  full_name: string;
  email?: string;
  zip_code: string;
  notification_email: boolean;
  notification_summary: boolean;
  notification_marketing: boolean;
  current_password: string;
  new_password: string;
  confirm_password: string;
  time_format: '12h' | '24h';
  temp_unit: 'F' | 'C';
  language: string;
}

export type SettingsTab = 'account' | 'notifications' | 'security' | 'appearance';

export interface SettingsProps {
  darkMode: boolean;
  formData: SettingsFormData;
  loading: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSaveProfile: () => Promise<void>;
  handleSaveNotifications: () => Promise<void>;
  handleUpdatePassword: () => Promise<void>;
  handleSaveAppearance: () => Promise<void>;
}
