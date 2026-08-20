import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const apiModule = await import('../services/api');
const { api, ApiError } = apiModule;

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('ApiError', () => {
    it('should create error with status and code', () => {
      const error = new ApiError('Test error', 404, 'NOT_FOUND');
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.name).toBe('ApiError');
    });
  });

  describe('api.get', () => {
    it('should make GET request with auth header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });

      localStorage.setItem('auth_token', 'test-token');
      const result = await api.get('/api/test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual({ data: 'test' });
    });

    it('should throw ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found', code: 'NOT_FOUND' }),
      });

      await expect(api.get('/api/test')).rejects.toThrow(ApiError);
    });

    it('should throw ApiError on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(api.get('/api/test')).rejects.toThrow(ApiError);
      await expect(api.get('/api/test')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });
    });
  });

  describe('api.post', () => {
    it('should make POST request with JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await api.post('/api/test', { key: 'value' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ key: 'value' }),
        })
      );
    });
  });

  describe('api.put', () => {
    it('should make PUT request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ updated: true }),
      });

      await api.put('/api/test/1', { name: 'updated' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('api.delete', () => {
    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ deleted: true }),
      });

      await api.delete('/api/test/1');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('api.upload', () => {
    it('should upload form data without content-type header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ uploaded: true }),
      });

      const formData = new FormData();
      formData.append('photo', new Blob(['test']));

      await api.upload('/api/upload', formData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/upload'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.not.objectContaining({
            'Content-Type': expect.anything(),
          }),
        })
      );
    });
  });
});