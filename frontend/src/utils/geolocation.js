/**
 * Geolocation utilities for location tagging
 */

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000,
};

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Get the current user position with proper error handling
 * @returns {Promise<{lat: number, lng: number, accuracy: number, altitude?: number, timestamp: number}>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
        }
        reject(new Error(errorMessage));
      },
      GEOLOCATION_OPTIONS
    );
  });
}

/**
 * Watch position changes
 * @param {Function} callback - Function to call with position updates
 * @returns {Function} - Function to stop watching
 */
export function watchPosition(callback) {
  if (!navigator.geolocation) {
    callback(new Error('Geolocation is not supported by this browser.'));
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback(null, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      let errorMessage;
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'The request to get user location timed out.';
          break;
        default:
          errorMessage = 'An unknown error occurred while watching location.';
      }
      callback(new Error(errorMessage));
    },
      GEOLOCATION_OPTIONS
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

/**
 * Reverse geocode coordinates to a human-readable address using OpenStreetMap Nominatim
 * @param {number} lat
 * @param {number} lng
 * @param {Object} options - Additional options for geocoding
 * @returns {Promise<string>} Human-readable location string
 */
export async function reverseGeocode(lat, lng, options = {}) {
  const params = new URLSearchParams({
    format: 'json',
    lat: lat.toString(),
    lon: lng.toString(),
    ...options,
  });

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}?${params}`, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'PicPocket/1.0 (+https://picpals.app)',
      },
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(`Geocoding request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    const { city, town, village, county, state, country, road, postcode } = data.address || {};
    
    const locationParts = [
      road,
      city || town || village,
      county,
      state,
      postcode,
      country
    ].filter(Boolean);

    return locationParts.length > 0 ? locationParts.join(', ') : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Geocoding request was cancelled');
    }
    console.warn('Failed to reverse geocode coordinates:', error.message);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Format coordinates as a string
 */
export function formatCoordinates(lat, lng, precision = 4) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(precision)}°${latDir}, ${Math.abs(lng).toFixed(precision)}°${lngDir}`;
}

/**
 * Calculate distance between two coordinates in kilometers (Haversine formula)
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if geolocation is available and permission status
 * @returns {Promise<{available: boolean, permission: string}>}
 */
export async function checkGeolocationSupport() {
  if (!navigator.geolocation) {
    return { available: false, permission: 'not_supported' };
  }

  if (!navigator.permissions) {
    return { available: true, permission: 'unknown' };
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return { available: true, permission: permission.state };
  } catch (error) {
    return { available: true, permission: 'unknown' };
  }
}