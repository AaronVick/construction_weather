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