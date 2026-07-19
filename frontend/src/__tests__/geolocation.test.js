import { formatCoordinates, calculateDistance } from '../utils/geolocation';

describe('geolocation utilities', () => {
  describe('formatCoordinates', () => {
    it('formats positive coordinates with N and E', () => {
      expect(formatCoordinates(51.5074, 0.1278)).toContain('N');
      expect(formatCoordinates(51.5074, 0.1278)).toContain('E');
    });

    it('formats negative latitude with S', () => {
      expect(formatCoordinates(-33.8688, 151.2093)).toContain('S');
    });

    it('formats negative longitude with W', () => {
      expect(formatCoordinates(40.7128, -74.006)).toContain('W');
    });

    it('formats to 4 decimal places', () => {
      const result = formatCoordinates(51.5074, 0.1278);
      expect(result).toMatch(/\d{1,3}\.\d{4}/);
    });
  });

  describe('calculateDistance', () => {
    it('returns 0 for same coordinates', () => {
      expect(calculateDistance(0, 0, 0, 0)).toBe(0);
    });

    it('calculates approximate distance between London and Paris', () => {
      const distance = calculateDistance(51.5074, -0.1278, 48.8566, 2.3522);
      // Should be roughly 340 km
      expect(distance).toBeGreaterThan(300);
      expect(distance).toBeLessThan(400);
    });

    it('returns positive distance', () => {
      const distance = calculateDistance(0, 0, 10, 10);
      expect(distance).toBeGreaterThan(0);
    });
  });
});
