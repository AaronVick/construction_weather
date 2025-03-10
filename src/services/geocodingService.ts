// src/services/geocodingService.ts
import axios from 'axios';

const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY || '';
const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

// Cache for geocoding results to reduce API calls
const geocodingCache = new Map<string, GeocodingResult>();

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

/**
 * Geocodes a full address to get coordinates
 * @param address Street address
 * @param city City name
 * @param state State or province
 * @param zipCode Postal code
 * @returns Geocoding result with latitude, longitude and formatted address
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zipCode: string
): Promise<GeocodingResult | null> {
  try {
    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
    
    // Check cache first
    const cacheKey = fullAddress.toLowerCase().trim();
    if (geocodingCache.has(cacheKey)) {
      return geocodingCache.get(cacheKey)!;
    }
    
    // If no API key is configured, use a mock response for development
    if (!GEOCODING_API_KEY) {
      console.warn('No GEOCODING_API_KEY provided. Using mock geocoding response.');
      const mockResult = getMockGeocodingResult(zipCode);
      geocodingCache.set(cacheKey, mockResult);
      return mockResult;
    }
    
    const response = await axios.get(GEOCODING_API_URL, {
      params: {
        address: fullAddress,
        key: GEOCODING_API_KEY
      }
    });
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const { lat, lng } = result.geometry.location;
      
      const geocodingResult: GeocodingResult = {
        latitude: lat,
        longitude: lng,
        formattedAddress: result.formatted_address
      };
      
      // Cache the result
      geocodingCache.set(cacheKey, geocodingResult);
      
      return geocodingResult;
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Geocodes a ZIP code to get coordinates
 * @param zipCode Postal code
 * @returns Geocoding result with latitude, longitude and formatted address
 */
export async function geocodeZipCode(zipCode: string): Promise<GeocodingResult | null> {
  try {
    // Check cache first
    const cacheKey = zipCode.toLowerCase().trim();
    if (geocodingCache.has(cacheKey)) {
      return geocodingCache.get(cacheKey)!;
    }
    
    // If no API key is configured, use a mock response for development
    if (!GEOCODING_API_KEY) {
      console.warn('No GEOCODING_API_KEY provided. Using mock geocoding response.');
      const mockResult = getMockGeocodingResult(zipCode);
      geocodingCache.set(cacheKey, mockResult);
      return mockResult;
    }
    
    const response = await axios.get(GEOCODING_API_URL, {
      params: {
        address: zipCode,
        key: GEOCODING_API_KEY
      }
    });
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const { lat, lng } = result.geometry.location;
      
      const geocodingResult: GeocodingResult = {
        latitude: lat,
        longitude: lng,
        formattedAddress: result.formatted_address
      };
      
      // Cache the result
      geocodingCache.set(cacheKey, geocodingResult);
      
      return geocodingResult;
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Validates a US ZIP code format
 * @param zipCode ZIP code to validate
 * @returns True if the ZIP code is valid
 */
export function isValidUSZipCode(zipCode: string): boolean {
  const zipCodeRegex = /^\d{5}(-\d{4})?$/;
  return zipCodeRegex.test(zipCode);
}

/**
 * Provides a mock geocoding result for development when no API key is available
 * @param zipCode ZIP code to mock
 * @returns Mock geocoding result
 */
function getMockGeocodingResult(zipCode: string): GeocodingResult {
  // Generate deterministic but random-looking coordinates based on ZIP code
  // This is just for development/testing purposes
  const zipSum = zipCode.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const latBase = 37.7749; // San Francisco latitude
  const lngBase = -122.4194; // San Francisco longitude
  
  // Add some variation based on the ZIP code
  const latOffset = (zipSum % 10) / 10;
  const lngOffset = (zipSum % 7) / 10;
  
  return {
    latitude: latBase + latOffset,
    longitude: lngBase + lngOffset,
    formattedAddress: `Mock Address for ${zipCode}, USA`
  };
}
