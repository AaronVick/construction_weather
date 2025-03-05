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

export interface WeatherSettings {
  checkTime: string;
  isEnabled: boolean;
  alertThresholds: {
    rain: { enabled: boolean; thresholdPercentage: number };
    snow: { enabled: boolean; thresholdInches: number };
    wind: { enabled: boolean; thresholdMph: number };
    temperature: { enabled: boolean; thresholdFahrenheit: number };
    anyRain: { enabled: boolean; thresholdInches: number };
  };
  notificationSettings: {
    notifyClient: boolean;
    notifyWorkers: boolean;
    notificationLeadHours: number;
    dailySummary: boolean;
  };
}