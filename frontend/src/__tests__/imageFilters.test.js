import { getCSSFilter, FILTERS, resizeImage, createThumbnail } from '../utils/imageFilters';

describe('imageFilters utilities', () => {
  describe('getCSSFilter', () => {
    it('returns "none" for NONE filter', () => {
      expect(getCSSFilter(FILTERS.NONE)).toBe('none');
    });

    it('returns grayscale filter string', () => {
      const result = getCSSFilter(FILTERS.GRAYSCALE, 1);
      expect(result).toContain('grayscale');
    });

    it('returns sepia filter string', () => {
      const result = getCSSFilter(FILTERS.SEPIA, 1);
      expect(result).toContain('sepia');
    });

    it('returns brightness for BRIGHT filter', () => {
      const result = getCSSFilter(FILTERS.BRIGHT, 1);
      expect(result).toContain('brightness');
    });

    it('returns blur filter string', () => {
      const result = getCSSFilter(FILTERS.BLUR, 1);
      expect(result).toContain('blur');
    });

    it('handles zero intensity', () => {
      const result = getCSSFilter(FILTERS.GRAYSCALE, 0);
      expect(result).toContain('grayscale(0)');
    });

    it('returns "none" for unknown filter', () => {
      expect(getCSSFilter('unknown-filter')).toBe('none');
    });
  });

  describe('FILTERS constants', () => {
    it('has expected filter types', () => {
      expect(FILTERS.NONE).toBeDefined();
      expect(FILTERS.GRAYSCALE).toBeDefined();
      expect(FILTERS.SEPIA).toBeDefined();
      expect(FILTERS.VINTAGE).toBeDefined();
      expect(FILTERS.BLUR).toBeDefined();
    });
  });
});
