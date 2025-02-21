// api/weather.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const WEATHER_API_KEY = process.env.WEATHER_API;
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';

// Helper functions
function checkIfRainy(conditionCode: number, precipMm: number): boolean {
  const rainCodes = [
    1063, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 
    1240, 1243, 1246, 1273, 1276
  ];
  return rainCodes.includes(conditionCode) || precipMm > 0;
}

function checkIfSnowy(conditionCode: number): boolean {
  const snowCodes = [
    1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 
    1255, 1258, 1279, 1282
  ];
  return snowCodes.includes(conditionCode);
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const { zipCode, days, type } = request.query;

  if (!zipCode) {
    return response.status(400).json({ error: 'Zip code is required' });
  }

  try {
    // Handle current weather request
    if (type === 'current') {
      const weatherResponse = await axios.get(`${WEATHER_API_BASE_URL}/current.json`, {
        params: {
          key: WEATHER_API_KEY,
          q: zipCode,
          aqi: 'no',
        },
      });

      const current = weatherResponse.data.current;
      const condition = current.condition;

      return response.status(200).json({
        temperature: current.temp_f,
        feelsLike: current.feelslike_f,
        condition: condition.text,
        humidity: current.humidity,
        windSpeed: current.wind_mph,
        precipitation: current.precip_in > 0 ? 100 : current.humidity > 80 ? 60 : 0,
        isRainy: checkIfRainy(condition.code, current.precip_mm),
        isSnowy: checkIfSnowy(condition.code),
        icon: condition.icon,
      });
    }

    // Handle forecast request
    const weatherResponse = await axios.get(`${WEATHER_API_BASE_URL}/forecast.json`, {
      params: {
        key: WEATHER_API_KEY,
        q: zipCode,
        days: days || 7,
        aqi: 'no',
        alerts: 'yes',
      },
    });

    const forecastDays = weatherResponse.data.forecast.forecastday;
    
    const forecast = forecastDays.map((day: any) => {
      const condition = day.day.condition;
      
      return {
        date: day.date,
        temperature: {
          min: day.day.mintemp_f,
          max: day.day.maxtemp_f,
          avg: day.day.avgtemp_f,
        },
        condition: condition.text,
        precipitation: day.day.daily_chance_of_rain,
        precipitationProbability: Math.max(day.day.daily_chance_of_rain, day.day.daily_chance_of_snow),
        humidity: day.day.avghumidity,
        windSpeed: day.day.maxwind_mph,
        snowfall: day.day.daily_chance_of_snow > 0 ? (day.day.totalsnow_cm / 2.54) : 0,
        icon: condition.icon,
      };
    });

    return response.status(200).json(forecast);
  } catch (error) {
    console.error('Weather API Error:', error);
    return response.status(500).json({ error: 'Failed to fetch weather data' });
  }
}