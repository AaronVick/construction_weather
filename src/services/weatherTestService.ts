// src/services/weatherTestService.ts
import axios from 'axios';

/**
 * Checks weather conditions against thresholds
 * @param weatherData Weather data from WeatherAPI.com
 * @param thresholds Thresholds for triggering conditions
 * @returns Object with triggered conditions
 */
export async function checkWeatherConditions(weatherData: any, thresholds: any): Promise<{ conditions: string[] }> {
  // Initialize triggered conditions array
  const triggeredConditions: string[] = [];
  
  // Check for weather alerts
  if (weatherData.alerts && weatherData.alerts.alert && weatherData.alerts.alert.length > 0) {
    triggeredConditions.push('weather_alert');
  }
  
  // Get current weather and forecast data
  const current = weatherData.current;
  const forecast = weatherData.forecast?.forecastday?.[0]?.day;
  const hourlyData = weatherData.forecast?.forecastday?.[0]?.hour || [];
  
  // Check temperature conditions
  if (thresholds.temperature && 
      ((thresholds.temperature.min !== undefined && current.temp_f <= thresholds.temperature.min) ||
       (thresholds.temperature.max !== undefined && current.temp_f >= thresholds.temperature.max))) {
    triggeredConditions.push('temperature');
  }
  
  // Check wind conditions
  if (thresholds.wind && 
      thresholds.wind.max !== undefined && 
      current.wind_mph >= thresholds.wind.max) {
    triggeredConditions.push('wind');
  }
  
  // Check precipitation conditions
  if (thresholds.precipitation && 
      thresholds.precipitation.max !== undefined) {
    // Check current precipitation
    if (current.precip_mm / 25.4 >= thresholds.precipitation.max) {
      triggeredConditions.push('rain');
    }
    
    // Check forecast precipitation
    if (forecast && forecast.totalprecip_in >= thresholds.precipitation.max) {
      triggeredConditions.push('rain');
    }
    
    // Check hourly precipitation (for next 6 hours)
    const next6Hours = hourlyData.slice(0, 6);
    const maxHourlyPrecip = Math.max(...next6Hours.map((hour: any) => hour.precip_in || 0));
    if (maxHourlyPrecip >= thresholds.precipitation.max) {
      triggeredConditions.push('rain');
    }
    
    // Check if any hour will have rain
    const willRainInNext6Hours = next6Hours.some((hour: any) => hour.will_it_rain === 1);
    if (willRainInNext6Hours) {
      triggeredConditions.push('any_rain');
    }
  }
  
  // Check snow conditions
  if (thresholds.snow && 
      thresholds.snow.max !== undefined) {
    // Check forecast snow
    if (forecast && forecast.totalsnow_cm / 2.54 >= thresholds.snow.max) {
      triggeredConditions.push('snow');
    }
    
    // Check hourly snow (for next 6 hours)
    const next6Hours = hourlyData.slice(0, 6);
    const willSnowInNext6Hours = next6Hours.some((hour: any) => hour.will_it_snow === 1);
    if (willSnowInNext6Hours) {
      triggeredConditions.push('snow');
    }
  }
  
  // Check for extreme conditions based on condition codes
  const EXTREME_CONDITION_CODES = [1117, 1225, 1237, 1261, 1264, 1282];
  
  if (EXTREME_CONDITION_CODES.includes(current.condition.code)) {
    triggeredConditions.push('extreme_conditions');
  }
  
  // Check hourly data for extreme conditions
  const next6Hours = hourlyData.slice(0, 6);
  const hasExtremeConditions = next6Hours.some((hour: any) => 
    EXTREME_CONDITION_CODES.includes(hour.condition.code)
  );
  
  if (hasExtremeConditions) {
    triggeredConditions.push('extreme_conditions');
  }
  
  return { conditions: triggeredConditions };
}

/**
 * Analyzes hourly forecast data for a specific timeframe
 * @param hours Array of hourly forecast data
 * @param startHour Starting hour (0-23)
 * @param duration Number of hours to analyze
 */
export function analyzeHourlyForecast(hours: any[], startHour: number = 0, duration: number = 6) {
  const relevantHours = hours.slice(startHour, startHour + duration);
  
  // Calculate averages and maximums for the timeframe
  const result = {
    avgTemp: 0,
    maxTemp: -Infinity,
    minTemp: Infinity,
    maxWindSpeed: 0,
    maxPrecipMm: 0,
    precipProbability: 0,
    willRain: false,
    willSnow: false,
    conditions: new Set<string>(),
    conditionCodes: new Set<number>()
  };
  
  relevantHours.forEach(hour => {
    // Update temperature stats
    result.avgTemp += hour.temp_f;
    result.maxTemp = Math.max(result.maxTemp, hour.temp_f);
    result.minTemp = Math.min(result.minTemp, hour.temp_f);
    
    // Update wind and precipitation
    result.maxWindSpeed = Math.max(result.maxWindSpeed, hour.wind_mph);
    result.maxPrecipMm = Math.max(result.maxPrecipMm, hour.precip_mm);
    result.precipProbability = Math.max(result.precipProbability, hour.chance_of_rain, hour.chance_of_snow);
    
    // Track conditions
    result.willRain = result.willRain || hour.will_it_rain === 1;
    result.willSnow = result.willSnow || hour.will_it_snow === 1;
    result.conditions.add(hour.condition.text);
    result.conditionCodes.add(hour.condition.code);
  });
  
  // Calculate average temperature
  result.avgTemp = result.avgTemp / relevantHours.length;
  
  // Check for severe conditions
  const EXTREME_CONDITION_CODES = [1117, 1225, 1237, 1261, 1264, 1282];
  const hasSevereConditions = Array.from(result.conditionCodes).some(code => 
    EXTREME_CONDITION_CODES.includes(code)
  );
  
  return {
    avgTemp: result.avgTemp,
    maxTemp: result.maxTemp,
    minTemp: result.minTemp,
    maxWindSpeed: result.maxWindSpeed,
    maxPrecipMm: result.maxPrecipMm,
    precipProbability: result.precipProbability,
    willRain: result.willRain,
    willSnow: result.willSnow,
    conditions: Array.from(result.conditions),
    conditionCodes: Array.from(result.conditionCodes),
    hasSevereConditions
  };
}
