import { WeatherWidgetForecast, ForecastDay } from '../types/weather';

// Transform ForecastDay to WeatherWidgetForecast format
export function transformForecastForWidget(forecast: ForecastDay[] | any[]): WeatherWidgetForecast[] {
  return forecast.map(day => ({
    date: day.date,
    temperature: {
      min: day.temperature.min,
      max: day.temperature.max,
    },
    condition: day.condition,
    precipitation: day.precipitation || 0,
    icon: day.icon,
  }));
}

// ✅ Ensure this line is present
export type { WeatherWidgetForecast };
