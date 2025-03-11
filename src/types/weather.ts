// src/types/weather.ts

export interface WeatherCondition {
  text: string;
  code: number;
  icon: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  isRainy: boolean;
  isSnowy: boolean;
  icon: string;
}

export interface ForecastDay {
  date: string;
  temperature: {
    min: number;
    max: number;
    avg: number;
  };
  condition: string;
  precipitation: number;
  precipitationProbability: number;
  humidity: number;
  windSpeed: number;
  snowfall: number;
  icon: string;
}

export interface WeatherWidgetForecast {
  date: string;
  temperature: {
    min: number;
    max: number;
  };
  condition: string;
  precipitation: number;
  icon: string;
}

export interface PrecipitationThresholds {
  enabled: boolean;
  thresholdPercentage: number; // Probability threshold
  amountThreshold: number; // Amount in inches
}

export interface TemperatureThresholds {
  enabled: boolean;
  minThresholdFahrenheit: number; // Minimum safe temperature
  maxThresholdFahrenheit: number; // Maximum safe temperature
}

export interface WindThresholds {
  enabled: boolean;
  thresholdMph: number; // Wind speed in MPH
}

export interface SpecialAlertThresholds {
  enabled: boolean;
  includeStorms: boolean;
  includeLightning: boolean;
  includeFlooding: boolean;
  includeExtreme: boolean; // Extreme weather events
}

export interface AirQualityThresholds {
  enabled: boolean;
  thresholdIndex: number; // AQI threshold
}

export interface NotificationRecipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'manager' | 'worker' | 'client';
  notificationMethods: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface ForecastTimeframe {
  hoursAhead: 2 | 4 | 6 | 12 | 24;
  workingHoursOnly: boolean;
  workingHoursStart: string; // Format: "HH:MM" in 24-hour time
  workingHoursEnd: string; // Format: "HH:MM" in 24-hour time
  includeDayBefore: boolean;
  checkDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
}

export interface WeatherSettings {
  isEnabled: boolean;
  checkTime: string; // Format: "HH:MM" in 24-hour time or frequency like "hourly", "daily"
  checkTimeDaily?: string; // Format: "HH:MM" in 24-hour time for daily checks
  timezone?: string; // IANA timezone string (e.g., "America/New_York")
  forecastTimeframe: ForecastTimeframe;
  alertThresholds: {
    rain: PrecipitationThresholds;
    snow: PrecipitationThresholds;
    sleet: PrecipitationThresholds;
    hail: PrecipitationThresholds;
    wind: WindThresholds;
    temperature: TemperatureThresholds;
    specialAlerts: SpecialAlertThresholds;
    airQuality: AirQualityThresholds;
  };
  notificationSettings: {
    notifyClient: boolean;
    notifyWorkers: boolean;
    notificationLeadHours: number;
    dailySummary: boolean;
    recipients: NotificationRecipient[];
  };
  jobTypeSettings?: {
    [jobType: string]: {
      name: string;
      description?: string;
      alertThresholds: Partial<WeatherSettings['alertThresholds']>;
    };
  };
}

export interface JobsiteWeatherSettings extends WeatherSettings {
  useGlobalDefaults: boolean;
  overrideGlobalSettings: boolean;
}
