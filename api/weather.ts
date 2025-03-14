// api/weather.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios, { AxiosError } from 'axios';
import NodeCache from 'node-cache';

const WEATHER_API_KEY = "c79650ec0dca4b67bbe154510251303";
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';
const CACHE_TTL = 30 * 60; // Cache for 30 minutes
const API_TIMEOUT = 10000; // 10 seconds timeout

// Cache for storing weather data to reduce API calls
const weatherCache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: 120 });

// Weather condition code mappings
const CONDITION_CODES = {
  RAIN: [1063, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246, 1273, 1276],
  SNOW: [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1279, 1282],
  STORM: [1087, 1273, 1276, 1279, 1282],
  EXTREME: [1117, 1225, 1237, 1261, 1264, 1282] // Extreme conditions like blizzard, ice, etc.
};

// Helper functions
function checkIfRainy(conditionCode: number, precipMm: number): boolean {
  return CONDITION_CODES.RAIN.includes(conditionCode) || precipMm > 0;
}

function checkIfSnowy(conditionCode: number): boolean {
  return CONDITION_CODES.SNOW.includes(conditionCode);
}

function checkIfExtreme(conditionCode: number): boolean {
  return CONDITION_CODES.EXTREME.includes(conditionCode);
}

/**
 * Formats a location query parameter based on user type and provided location data
 * @param location Location data (zipcode, coordinates, or address)
 * @param isPro Whether the user is a pro user with access to advanced location features
 * @param latitude Optional latitude for precise location
 * @param longitude Optional longitude for precise location
 */
function formatLocationQuery(
  location: string, 
  isPro: boolean = false,
  latitude?: number | null,
  longitude?: number | null
): string {
  // For pro users with coordinates, use them for precise weather
  if (isPro && latitude !== undefined && latitude !== null && 
      longitude !== undefined && longitude !== null) {
    return `${latitude},${longitude}`;
  }
  
  // For pro users, check if the location is in coordinate format (lat,lon)
  if (isPro && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(location)) {
    return location; // Already in correct format for coordinates
  }
  
  // For all users, return the location as is (zipcode or address)
  return location;
}

/**
 * Analyzes hourly forecast data for a specific timeframe
 * @param hours Array of hourly forecast data
 * @param startHour Starting hour (0-23)
 * @param duration Number of hours to analyze
 */
function analyzeHourlyForecast(hours: any[], startHour: number = 0, duration: number = 6) {
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
    hasSevereConditions: Array.from(result.conditionCodes).some(code => checkIfExtreme(code))
  };
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const { location: locationQuery, days, type, isPro, latitude, longitude } = request.query;
  const userIsPro = isPro === 'true';

  if (!locationQuery) {
    return response.status(400).json({ error: 'Location is required' });
  }

  // Generate cache key based on request parameters
  const cacheKey = `weather_${type || 'forecast'}_${locationQuery}_${days || 7}`;
  
  // Check if we have cached data
  const cachedData = weatherCache.get(cacheKey);
  if (cachedData) {
    return response.status(200).json(cachedData);
  }

  try {
    // Format location query based on user type and coordinates if available
    const formattedLocation = formatLocationQuery(
      locationQuery as string, 
      userIsPro,
      latitude ? parseFloat(latitude as string) : null,
      longitude ? parseFloat(longitude as string) : null
    );
    
    // Handle current weather request
    if (type === 'current') {
      const weatherResponse = await axios.get(`${WEATHER_API_BASE_URL}/current.json`, {
        params: {
          key: WEATHER_API_KEY,
          q: formattedLocation,
          aqi: 'no',
        },
        timeout: API_TIMEOUT
      });

      const current = weatherResponse.data.current;
      const condition = current.condition;
      const location = weatherResponse.data.location;

      const result = {
        temperature: current.temp_f,
        feelsLike: current.feelslike_f,
        condition: condition.text,
        conditionCode: condition.code,
        humidity: current.humidity,
        windSpeed: current.wind_mph,
        windDirection: current.wind_dir,
        precipitation: current.precip_in > 0 ? 100 : current.humidity > 80 ? 60 : 0,
        precipMm: current.precip_mm,
        isRainy: checkIfRainy(condition.code, current.precip_mm),
        isSnowy: checkIfSnowy(condition.code),
        isExtreme: checkIfExtreme(condition.code),
        icon: condition.icon,
        location: {
          name: location.name,
          region: location.region,
          country: location.country,
          lat: location.lat,
          lon: location.lon,
          localtime: location.localtime
        }
      };

      // Cache the result
      weatherCache.set(cacheKey, result);
      return response.status(200).json(result);
    }

    // Handle forecast request
    const weatherResponse = await axios.get(`${WEATHER_API_BASE_URL}/forecast.json`, {
      params: {
        key: WEATHER_API_KEY,
        q: formattedLocation,
        days: days || 7,
        aqi: 'no',
        alerts: 'yes',
        hour: 24 // Ensure we get all 24 hours of data
      },
      timeout: API_TIMEOUT
    });

    const forecastDays = weatherResponse.data.forecast.forecastday;
    const alerts = weatherResponse.data.alerts?.alert || [];
    const location = weatherResponse.data.location;
    
    const forecast = forecastDays.map((day: any) => {
      const condition = day.day.condition;
      const hourlyAnalysis = analyzeHourlyForecast(day.hour, 6, 12); // Analyze working hours (6am-6pm)
      
      return {
        date: day.date,
        dateEpoch: day.date_epoch,
        temperature: {
          min: day.day.mintemp_f,
          max: day.day.maxtemp_f,
          avg: day.day.avgtemp_f,
        },
        condition: condition.text,
        conditionCode: condition.code,
        precipitation: day.day.daily_chance_of_rain,
        precipitationProbability: Math.max(day.day.daily_chance_of_rain, day.day.daily_chance_of_snow),
        totalPrecipIn: day.day.totalprecip_in,
        totalPrecipMm: day.day.totalprecip_mm,
        humidity: day.day.avghumidity,
        windSpeed: day.day.maxwind_mph,
        windDirection: day.day.wind_dir,
        snowfall: day.day.daily_chance_of_snow > 0 ? (day.day.totalsnow_cm / 2.54) : 0,
        icon: condition.icon,
        sunrise: day.astro.sunrise,
        sunset: day.astro.sunset,
        moonPhase: day.astro.moon_phase,
        workingHours: hourlyAnalysis,
        hourly: day.hour.map((hour: any) => ({
          time: hour.time,
          temp: hour.temp_f,
          condition: hour.condition.text,
          conditionCode: hour.condition.code,
          windSpeed: hour.wind_mph,
          precipMm: hour.precip_mm,
          chanceOfRain: hour.chance_of_rain,
          chanceOfSnow: hour.chance_of_snow,
          willRain: hour.will_it_rain === 1,
          willSnow: hour.will_it_snow === 1,
          humidity: hour.humidity,
          feelsLike: hour.feelslike_f,
          icon: hour.condition.icon
        }))
      };
    });

    const result = {
      forecast,
      location: {
        name: location.name,
        region: location.region,
        country: location.country,
        lat: location.lat,
        lon: location.lon,
        localtime: location.localtime
      },
      alerts: alerts.map((alert: any) => ({
        headline: alert.headline,
        severity: alert.severity,
        urgency: alert.urgency,
        areas: alert.areas,
        category: alert.category,
        event: alert.event,
        effective: alert.effective,
        expires: alert.expires,
        desc: alert.desc
      }))
    };

    // Cache the result
    weatherCache.set(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    console.error('Weather API Error:', error);
    
    // Enhanced error handling
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED') {
        return response.status(504).json({ 
          error: 'Weather API request timed out',
          message: 'The weather service is currently slow to respond. Please try again later.'
        });
      }
      
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const statusCode = axiosError.response.status;
        const errorData = axiosError.response.data as any;
        
        return response.status(statusCode).json({
          error: 'Weather API error',
          message: errorData?.error?.message || 'Failed to fetch weather data',
          code: statusCode
        });
      }
    }
    
    return response.status(500).json({ 
      error: 'Failed to fetch weather data',
      message: 'An unexpected error occurred while fetching weather data. Please try again later.'
    });
  }
}
