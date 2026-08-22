/**
 * Location utilities for TwoBeOne
 * Handles geolocation, distance calculation, and location management
 */

export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  timestamp?: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance with appropriate unit
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    // Show in meters if less than 1km
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m`;
  } else if (distanceKm < 10) {
    // Show 1 decimal place for distances under 10km
    return `${distanceKm.toFixed(1)}km`;
  } else {
    // Show whole number for larger distances
    return `${Math.round(distanceKm)}km`;
  }
}

/**
 * Get user's current location using browser Geolocation API
 */
export async function getCurrentLocation(): Promise<Location | null> {
  if (!('geolocation' in navigator)) {
    console.error('[Location] Geolocation is not supported');
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
        };

        // Try to get city/country from reverse geocoding
        try {
          const address = await reverseGeocode(
            location.latitude,
            location.longitude
          );
          location.city = address.city;
          location.country = address.country;
        } catch (error) {
          console.error('[Location] Reverse geocoding failed:', error);
        }

        resolve(location);
      },
      (error) => {
        console.error('[Location] Error getting location:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<PermissionState> {
  if (!('permissions' in navigator)) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch (error) {
    console.error('[Location] Permission query failed:', error);
    return 'prompt';
  }
}

/**
 * Reverse geocode coordinates to get city/country
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ city?: string; country?: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      {
        headers: {
          'User-Agent': 'TwoBeOne App',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    return {
      city: data.address?.city || data.address?.town || data.address?.village,
      country: data.address?.country,
    };
  } catch (error) {
    console.error('[Location] Reverse geocoding error:', error);
    return {};
  }
}

/**
 * Get location from city name (forward geocoding)
 */
export async function geocodeCity(
  cityName: string
): Promise<Location | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`,
      {
        headers: {
          'User-Agent': 'TwoBeOne App',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    if (data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      city: result.display_name.split(',')[0],
      country: result.display_name.split(',').pop()?.trim(),
    };
  } catch (error) {
    console.error('[Location] Forward geocoding error:', error);
    return null;
  }
}

/**
 * Check if two locations are the same (within 1km)
 */
export function isSameLocation(
  loc1: Location | null,
  loc2: Location | null
): boolean {
  if (!loc1 || !loc2) return false;
  
  const distance = calculateDistance(
    loc1.latitude,
    loc1.longitude,
    loc2.latitude,
    loc2.longitude
  );
  
  return distance < 1; // Within 1km
}

/**
 * Get emoji for distance range
 */
export function getDistanceEmoji(distanceKm: number): string {
  if (distanceKm < 1) return '🏠'; // Same location
  if (distanceKm < 10) return '🚶'; // Walking distance
  if (distanceKm < 50) return '🚴'; // Biking distance
  if (distanceKm < 200) return '🚗'; // Driving distance
  if (distanceKm < 1000) return '🚄'; // Train distance
  return '✈️'; // Flight distance
}

/**
 * Get description for distance range
 */
export function getDistanceDescription(distanceKm: number): string {
  if (distanceKm < 1) return 'Together';
  if (distanceKm < 10) return 'Nearby';
  if (distanceKm < 50) return 'Close';
  if (distanceKm < 200) return 'Same region';
  if (distanceKm < 1000) return 'Same country';
  return 'Long distance';
}
