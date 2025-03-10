import { WeatherWidgetForecast } from '../types/weather';
import { ForecastDay as ServiceForecastDay } from '../services/weatherService';

// Accept either type of ForecastDay (from types/weather.ts or services/weatherService.ts)
export function transformForecastForWidget(forecast: ServiceForecastDay[] | any[]): WeatherWidgetForecast[] {
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
