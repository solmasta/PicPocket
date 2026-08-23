import { analyzePhoto, getStorageInsights } from '../services/aiService';
import api from '../services/api';

jest.mock('../services/api');

describe('aiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzePhoto', () => {
    it('should return tags and caption on success', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      api.post.mockResolvedValue({
        data: {
          tags: ['nature', 'landscape'],
          caption: 'Beautiful scenery'
        }
      });

      const result = await analyzePhoto(mockFile);

      expect(result).toEqual({
        tags: ['nature', 'landscape'],
        caption: 'Beautiful scenery'
      });
    });

    it('should return empty results on error', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      api.post.mockRejectedValue(new Error('Network error'));

      const result = await analyzePhoto(mockFile);

      expect(result).toEqual({
        tags: [],
        caption: ''
      });
    });

    it('should handle missing tags array', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      api.post.mockResolvedValue({
        data: {
          caption: 'Test caption'
        }
      });

      const result = await analyzePhoto(mockFile);

      expect(result.tags).toEqual([]);
    });
  });

  describe('getStorageInsights', () => {
    it('should return AI insights on success', async () => {
      const stats = {
        totalPhotos: 100,
        totalBytes: 1024 * 1024 * 500,
        backedUpNowhere: 10,
        perProvider: { googleDrive: 50 },
        duplicateGroups: 5,
        duplicateWastedBytes: 1024 * 1024 * 100
      };
      api.post.mockResolvedValue({
        data: {
          summary: 'Great storage management',
          recommendations: ['Keep it up'],
          source: 'ai'
        }
      });

      const result = await getStorageInsights(stats);

      expect(result.summary).toBe('Great storage management');
      expect(result.source).toBe('ai');
    });

    it('should return offline insights on error', async () => {
      const stats = {
        totalPhotos: 100,
        totalBytes: 1024 * 1024 * 500,
        backedUpNowhere: 10,
        perProvider: {},
        duplicateGroups: 5,
        duplicateWastedBytes: 1024 * 1024 * 100
      };
      api.post.mockRejectedValue(new Error('Network error'));

      const result = await getStorageInsights(stats);

      expect(result.source).toBe('offline');
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should recommend backup when no providers connected', async () => {
      const stats = {
        totalPhotos: 50,
        totalBytes: 1024 * 1024 * 100,
        backedUpNowhere: 0,
        perProvider: {},
        duplicateGroups: 0,
        duplicateWastedBytes: 0
      };

      const result = await getStorageInsights(stats);

      expect(result.recommendations.some(r => r.includes('Connect'))).toBe(true);
    });

    it('should handle empty stats', async () => {
      const result = await getStorageInsights({});

      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should recommend clearing duplicates when present', async () => {
      const stats = {
        totalPhotos: 100,
        totalBytes: 1024 * 1024 * 500,
        backedUpNowhere: 0,
        perProvider: { dropbox: 100 },
        duplicateGroups: 3,
        duplicateWastedBytes: 1024 * 1024 * 50
      };

      const result = await getStorageInsights(stats);

      expect(result.recommendations.some(r => r.includes('duplicate'))).toBe(true);
    });
  });
});