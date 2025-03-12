// src/types/weather.ts

// Weather data types
export interface WeatherCondition {
  text: string;
  code?: number;
  icon: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number; // Can be in inches or percentage depending on context
  isRainy: boolean;
  isSnowy: boolean;
  isExtreme?: boolean;
  icon: string;
}

export interface ForecastDay {
  date: string;
  temperature: {
    min: number;
    max: number;
    avg?: number;
  };
  condition: string;
  precipitation: number; // percentage chance of rain
  precipitationProbability?: number; // For backward compatibility
  humidity: number;
  windSpeed: number;
  snowfall?: number;
  icon: string;
  hourly?: HourlyForecast[];
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
  precipitation: number;
  windSpeed: number;
  icon: string;
}

export interface WeatherAlert {
  headline: string;
  severity: string;
  event: string;
  effective: string;
  expires: string;
  description: string;
}

export interface WeatherWidgetForecast {
  date: string;
  temperature: {
    min: number;
    max: number;
  };
  condition: string;
  precipitation: number; // Can be decimal (0-1) or percentage (0-100) depending on component
  icon: string;
}

export interface WeatherLocation {
  name: string;
  region: string;
  country: string;
  lat?: number;
  lon?: number;
}

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  forecast: ForecastDay[];
  alerts: WeatherAlert[];
  lastUpdated?: Date;
}

export interface WeatherThresholds {
  temperature?: {
    min: number;
    max: number;
    enabled?: boolean;
    thresholdFahrenheit?: number;
  };
  wind?: {
    max: number;
    enabled?: boolean;
    thresholdMph?: number;
  };
  precipitation?: {
    max: number;
    enabled?: boolean;
    thresholdPercentage?: number;
  };
  snow?: {
    max: number;
    enabled?: boolean;
    thresholdInches?: number;
  };
}

// Weather notification settings types
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