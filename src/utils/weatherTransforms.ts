// src/utils/weatherTransforms.ts
import { ForecastDay, WeatherWidgetForecast } from '../types/weather';

export function transformForecastForWidget(forecast: ForecastDay[]): WeatherWidgetForecast[] {
  return forecast.map(day => ({
    date: day.date,
    temperature: {
      min: day.temperature.min,
      max: day.temperature.max,
    },
    condition: day.condition,
    precipitation: day.precipitation,
    icon: day.icon,
  }));
}