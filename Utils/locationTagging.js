/**
 * Utils/locationTagging.js
 *
 * Utilities for reading GPS coordinates from image EXIF data and
 * performing reverse-geocoding to produce human-readable place names
 * for PicPocket's location tagging feature.
 */

// ─── EXIF GPS extraction ─────────────────────────────────────────────────────

/**
 * Extract GPS coordinates from a JPEG image Blob by parsing its EXIF data.
 *
 * @param {Blob} imageBlob - The JPEG image to inspect.
 * @returns {Promise<{latitude: number, longitude: number, altitude?: number}|null>}
 *   Resolved with coordinates, or null if none are found.
 */
export async function getGpsFromExif(imageBlob) {
  // We only need the first 128 KB which is more than enough to cover EXIF
  const buffer = await imageBlob.slice(0, 131072).arrayBuffer();
  const view = new DataView(buffer);

  if (view.getUint16(0) !== 0xffd8) return null; // Not a JPEG

  let offset = 2;
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset);
    const segmentLength = view.getUint16(offset + 2);

    if (marker === 0xffe1) {
      // APP1 – check for Exif header ('Exif\0\0')
      const headerStr = readAscii(view, offset + 4, 4);
      if (headerStr === 'Exif') {
        const tiffBase = offset + 10;
        const littleEndian = view.getUint16(tiffBase) === 0x4949;
        const firstIfdOffset = view.getUint32(tiffBase + 4, littleEndian);
        const gps = extractGpsIfd(view, tiffBase, firstIfdOffset, littleEndian);
        if (gps) return gps;
      }
    }

    offset += 2 + segmentLength;
  }

  return null;
}

// ─── Reverse geocoding ───────────────────────────────────────────────────────

/**
 * Convert GPS coordinates to a human-readable place name using the
 * OpenStreetMap Nominatim API (no API key required).
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {object} [options]
 * @param {string} [options.language] - BCP 47 language tag for the result (default: 'en').
 * @returns {Promise<LocationTag>}
 */
export async function reverseGeocode(latitude, longitude, options = {}) {
  const lang = options.language || 'en';
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', latitude.toString());
  url.searchParams.set('lon', longitude.toString());
  url.searchParams.set('format', 'json');
  url.searchParams.set('accept-language', lang);

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': 'PicPocket/1.0' },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return buildLocationTag(latitude, longitude, data);
}

/**
 * Tag a photo with its location by reading EXIF GPS data and, optionally,
 * performing reverse geocoding to attach a place name.
 *
 * @param {Blob}    imageBlob            - The image to inspect.
 * @param {object}  [options]
 * @param {boolean} [options.geocode]    - Whether to perform reverse geocoding (default: true).
 * @param {string}  [options.language]   - Language for the geocoded place name.
 * @returns {Promise<LocationTag|null>}  - Resolved with a LocationTag, or null if no GPS found.
 */
export async function tagPhotoWithLocation(imageBlob, options = {}) {
  const { geocode = true, language } = options;

  const coords = await getGpsFromExif(imageBlob);
  if (!coords) return null;

  if (!geocode) {
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: coords.altitude,
      placeName: null,
      address: null,
    };
  }

  return reverseGeocode(coords.latitude, coords.longitude, { language });
}

/**
 * Use the browser Geolocation API to get the device's current position and
 * reverse-geocode it to a location tag.
 *
 * @param {object}  [options]
 * @param {boolean} [options.highAccuracy] - Enable high accuracy mode (default: false).
 * @param {number}  [options.timeout]      - Timeout in milliseconds (default: 10000).
 * @param {boolean} [options.geocode]      - Whether to reverse-geocode (default: true).
 * @param {string}  [options.language]     - Language for the geocoded result.
 * @returns {Promise<LocationTag>}
 */
export async function getCurrentLocationTag(options = {}) {
  const {
    highAccuracy = false,
    timeout = 10_000,
    geocode = true,
    language,
  } = options;

  const position = await new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: highAccuracy,
      timeout,
      maximumAge: 60_000,
    });
  });

  const { latitude, longitude, altitude } = position.coords;

  if (!geocode) {
    return { latitude, longitude, altitude: altitude ?? undefined, placeName: null, address: null };
  }

  return reverseGeocode(latitude, longitude, { language });
}

/**
 * Format a LocationTag as a concise human-readable string.
 *
 * @param {LocationTag} locationTag
 * @returns {string}  E.g. "Eiffel Tower, Paris, France" or "48.8584, 2.2945"
 */
export function formatLocationTag(locationTag) {
  if (!locationTag) return '';
  if (locationTag.placeName) return locationTag.placeName;
  return `${locationTag.latitude.toFixed(6)}, ${locationTag.longitude.toFixed(6)}`;
}

/**
 * Calculate the distance in kilometres between two GPS coordinates using
 * the Haversine formula.
 *
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometres.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Type definition (JSDoc) ─────────────────────────────────────────────────

/**
 * @typedef {object} LocationTag
 * @property {number}      latitude
 * @property {number}      longitude
 * @property {number|undefined} altitude  - Metres above sea level (if available).
 * @property {string|null} placeName      - Short display name (e.g. "Paris, France").
 * @property {object|null} address        - Full structured address from Nominatim.
 */

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Build a LocationTag from Nominatim reverse-geocode JSON.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {object} nominatimResult
 * @returns {LocationTag}
 */
function buildLocationTag(latitude, longitude, nominatimResult) {
  const addr = nominatimResult.address || {};

  // Build a concise place name from the most relevant parts
  const parts = [
    addr.tourism || addr.amenity || addr.building || addr.road,
    addr.city || addr.town || addr.village || addr.hamlet,
    addr.country,
  ].filter(Boolean);

  return {
    latitude,
    longitude,
    altitude: undefined,
    placeName: parts.length ? parts.join(', ') : nominatimResult.display_name || null,
    address: addr,
  };
}

/**
 * Walk a TIFF IFD to find the GPS sub-IFD and extract coordinates from it.
 *
 * @param {DataView} view
 * @param {number}   tiffBase    - Byte offset of the TIFF header in `view`.
 * @param {number}   ifdOffset   - Byte offset of the IFD (relative to tiffBase).
 * @param {boolean}  littleEndian
 * @returns {{latitude: number, longitude: number, altitude?: number}|null}
 */
function extractGpsIfd(view, tiffBase, ifdOffset, littleEndian) {
  const absIfd = tiffBase + ifdOffset;
  const entryCount = view.getUint16(absIfd, littleEndian);

  let gpsIfdOffset = null;

  for (let i = 0; i < entryCount; i++) {
    const entry = absIfd + 2 + i * 12;
    const tag = view.getUint16(entry, littleEndian);
    if (tag === 0x8825) {
      // GPSInfo IFD pointer
      gpsIfdOffset = view.getUint32(entry + 8, littleEndian);
    }
  }

  if (gpsIfdOffset === null) return null;

  // Parse GPS IFD
  const gpsBase = tiffBase + gpsIfdOffset;
  const gpsEntryCount = view.getUint16(gpsBase, littleEndian);
  const gpsFields = {};

  for (let i = 0; i < gpsEntryCount; i++) {
    const entry = gpsBase + 2 + i * 12;
    const tag = view.getUint16(entry, littleEndian);
    const type = view.getUint16(entry + 2, littleEndian);
    const count = view.getUint32(entry + 4, littleEndian);
    gpsFields[tag] = { entry, type, count };
  }

  const latRef = readGpsRef(view, gpsFields[0x01], littleEndian);
  const latVal = readRationals(view, gpsFields[0x02], 3, tiffBase, littleEndian);
  const lonRef = readGpsRef(view, gpsFields[0x03], littleEndian);
  const lonVal = readRationals(view, gpsFields[0x04], 3, tiffBase, littleEndian);

  if (!latVal || !lonVal) return null;

  let latitude = dmsToDecimal(latVal);
  let longitude = dmsToDecimal(lonVal);

  if (latRef === 'S') latitude = -latitude;
  if (lonRef === 'W') longitude = -longitude;

  const result = { latitude, longitude };

  // Altitude (optional)
  const altField = gpsFields[0x06];
  if (altField) {
    const altRationals = readRationals(view, altField, 1, tiffBase, littleEndian);
    const altRef = gpsFields[0x05]
      ? view.getUint8(gpsFields[0x05].entry + 8)
      : 0;
    if (altRationals) {
      result.altitude = altRef === 1 ? -altRationals[0] : altRationals[0];
    }
  }

  return result;
}

/**
 * Read a GPS reference character ('N','S','E','W') from an IFD entry.
 *
 * @param {DataView}      view
 * @param {{entry:number}}  field
 * @param {boolean}       littleEndian
 * @returns {string|null}
 */
function readGpsRef(view, field, littleEndian) {
  if (!field) return null;
  return String.fromCharCode(view.getUint8(field.entry + 8));
}

/**
 * Read `count` RATIONAL (unsigned) values from an IFD entry.
 * RATIONAL = two 32-bit unsigned integers (numerator / denominator).
 *
 * @param {DataView}      view
 * @param {{entry:number, type:number, count:number}|undefined} field
 * @param {number}        expectedCount
 * @param {number}        tiffBase
 * @param {boolean}       littleEndian
 * @returns {number[]|null}
 */
function readRationals(view, field, expectedCount, tiffBase, littleEndian) {
  if (!field || field.count < expectedCount) return null;

  // RATIONAL values longer than 4 bytes use an offset pointer
  const valueOffset = tiffBase + view.getUint32(field.entry + 8, littleEndian);
  const values = [];
  for (let i = 0; i < expectedCount; i++) {
    const num = view.getUint32(valueOffset + i * 8, littleEndian);
    const den = view.getUint32(valueOffset + i * 8 + 4, littleEndian);
    values.push(den !== 0 ? num / den : 0);
  }
  return values;
}

/**
 * Convert [degrees, minutes, seconds] to a decimal-degree value.
 *
 * @param {number[]} dms
 * @returns {number}
 */
function dmsToDecimal([degrees, minutes, seconds]) {
  return degrees + minutes / 60 + seconds / 3600;
}

/**
 * Read `length` ASCII characters from `view` starting at `offset`.
 *
 * @param {DataView} view
 * @param {number}   offset
 * @param {number}   length
 * @returns {string}
 */
function readAscii(view, offset, length) {
  let str = '';
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(view.getUint8(offset + i));
  }
  return str;
}

/**
 * Convert degrees to radians.
 *
 * @param {number} deg
 * @returns {number}
 */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}
