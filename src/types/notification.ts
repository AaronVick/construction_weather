// src/types/notification.ts

export interface Notification {
    id: string;
    type: 'weather' | 'system' | 'info' | 'custom';
    title: string;
    message: string;
    read: boolean;
    timestamp: string;
    metadata?: Record<string, any>;
  }
  
  export interface NotificationStats {
    totalSent: number;
    weatherNotifications: number;
    last30Days: number;
  }
  
  export interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    push: boolean;
    digest: 'instant' | 'daily' | 'weekly' | 'none';
    types: {
      weather: boolean;
      system: boolean;
      marketing: boolean;
    };
  }