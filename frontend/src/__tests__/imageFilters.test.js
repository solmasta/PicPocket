import { FILTERS, FILTER_LABELS, getCSSFilter, applyFilterToImage } from '../utils/imageFilters';

describe('imageFilters', () => {
  describe('FILTERS constants', () => {
    it('should have all expected filter types', () => {
      expect(FILTERS.NONE).toBe('none');
      expect(FILTERS.GRAYSCALE).toBe('grayscale');
      expect(FILTERS.SEPIA).toBe('sepia');
      expect(FILTERS.VINTAGE).toBe('vintage');
      expect(FILTERS.BRIGHT).toBe('bright');
      expect(FILTERS.CONTRAST).toBe('contrast');
      expect(FILTERS.BLUR).toBe('blur');
      expect(FILTERS.SHARPEN).toBe('sharpen');
      expect(FILTERS.WARM).toBe('warm');
      expect(FILTERS.COOL).toBe('cool');
      expect(FILTERS.FADE).toBe('fade');
      expect(FILTERS.VIGNETTE).toBe('vignette');
    });
  });

  describe('FILTER_LABELS', () => {
    it('should have labels for all filters', () => {
      Object.values(FILTERS).forEach(filter => {
        expect(FILTER_LABELS[filter]).toBeDefined();
      });
    });
  });

  describe('getCSSFilter', () => {
    it('should return none for NONE filter', () => {
      expect(getCSSFilter(FILTERS.NONE)).toBe('none');
    });

    it('should apply intensity to grayscale', () => {
      expect(getCSSFilter(FILTERS.GRAYSCALE, 0.5)).toBe('grayscale(0.5)');
      expect(getCSSFilter(FILTERS.GRAYSCALE, 1)).toBe('grayscale(1)');
    });

    it('should apply intensity to sepia', () => {
      expect(getCSSFilter(FILTERS.SEPIA, 0.5)).toBe('sepia(0.5)');
    });

    it('should use preset for vintage', () => {
      const result = getCSSFilter(FILTERS.VINTAGE);
      expect(result).toContain('sepia');
      expect(result).toContain('contrast');
      expect(result).toContain('brightness');
    });

    it('should apply intensity to bright', () => {
      expect(getCSSFilter(FILTERS.BRIGHT, 1)).toBe('brightness(1.5)');
    });

    it('should apply intensity to contrast', () => {
      expect(getCSSFilter(FILTERS.CONTRAST, 1)).toBe('contrast(1.5)');
    });

    it('should apply intensity to blur', () => {
      expect(getCSSFilter(FILTERS.BLUR, 1)).toBe('blur(3px)');
      expect(getCSSFilter(FILTERS.BLUR, 0.5)).toBe('blur(1.5px)');
    });

    it('should use preset for warm', () => {
      const result = getCSSFilter(FILTERS.WARM);
      expect(result).toContain('sepia');
      expect(result).toContain('saturate');
    });

    it('should use preset for cool', () => {
      const result = getCSSFilter(FILTERS.COOL);
      expect(result).toContain('saturate');
      expect(result).toContain('hue-rotate');
    });

    it('should apply intensity to fade', () => {
      expect(getCSSFilter(FILTERS.FADE, 1)).toBe('opacity(0.7)');
    });

    it('should apply intensity to sharpen', () => {
      expect(getCSSFilter(FILTERS.SHARPEN, 1)).toBe('contrast(1.3)');
    });

    it('should default to none for unknown filter', () => {
      expect(getCSSFilter('unknown')).toBe('none');
    });
  });
});