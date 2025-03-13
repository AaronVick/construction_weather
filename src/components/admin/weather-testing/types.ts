// src/components/admin/weather-testing/types.ts

// Form data types
export interface WeatherTestFormData {
  locationType: 'zipcode' | 'address' | 'coordinates';
  zipcode?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  testDate: Date;
  overrideConditions: boolean;
  conditions: {
    temperature: boolean;
    temperatureValue: number;
    rain: boolean;
    rainProbability: number;
    snow: boolean;
    snowAmount: number;
    wind: boolean;
    windSpeed: number;
    alert: boolean;
    alertType: string;
  };
  sendTestEmail: boolean;
  testEmailRecipients: string;
  dryRun: boolean;
}

// API response types
export interface WeatherTestResult {
  timestamp: string;
  weatherData: any;
  thresholds: any;
  triggeredConditions: string[];
  notificationPreview: {
    subject: string;
    recipients: Array<{
      email: string;
      name?: string;
      type: string;
    }>;
    templateId: string;
    templateData: any;
  };
  emailSent: boolean;
  emailResponse?: any;
  logs: Array<{
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
    data?: any;
  }>;
}

// API status types
export interface ApiStatus {
  weatherApi: {
    status: 'unknown' | 'ok' | 'error';
    message?: string;
    rateLimitRemaining?: number;
    lastChecked?: string;
  };
  sendgrid: {
    status: 'unknown' | 'ok' | 'error';
    message?: string;
    lastChecked?: string;
  };
}

// Jobsite data types
export interface JobsiteOption {
  id: string;
  name: string;
  address?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}
