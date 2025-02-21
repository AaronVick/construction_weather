// src/types/jobsite.ts

export interface Jobsite {
  id: string;
  name: string;
  client_id: string; 
  address?: string;
  city?: string;
  state?: string;
  zip_code: string;  
  is_active: boolean;
  weather_monitoring: any; // Schema shows this as JSON
  location?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;   
}
  
  export interface WeatherMonitoringSettings {
    isEnabled: boolean;
    checkTime: string; // Format: "HH:MM" in 24-hour time
    alertThresholds: {
      rain: {
        enabled: boolean;
        thresholdPercentage: number; // Probability threshold, e.g., 50% chance of rain
      };
      snow: {
        enabled: boolean;
        thresholdInches: number; // Expected accumulation in inches
      };
      wind: {
        enabled: boolean;
        thresholdMph: number; // Wind speed in MPH
      };
      temperature: {
        enabled: boolean;
        thresholdFahrenheit: number; // Temperature in Fahrenheit
      };
    };
    notificationSettings: {
      notifyClient: boolean;
      notifyWorkers: boolean;
      notificationLeadHours: number; // How many hours in advance to send notifications
    };
  }
  
  export interface JobsiteFormData {
    name: string;
    clientId: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode: string;
    isActive: boolean;
    notes?: string;
    weatherMonitoring: WeatherMonitoringSettings;
    assignedWorkers?: string[];
  }
  
  export interface JobsiteFilters {
    clientId: string | 'all';
    status: 'all' | 'active' | 'inactive';
    weatherMonitoring: 'all' | 'enabled' | 'disabled';
    sortBy: 'nameAsc' | 'nameDesc' | 'dateAsc' | 'dateDesc';
  }

  export interface JobsiteStats {
    total: number;
    withWeatherMonitoring: number;
    withRecentAlerts: number;
  }