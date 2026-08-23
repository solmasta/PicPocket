import api, { createApiInstance } from '../services/apiService';

const ORIGINAL_FETCH = global.fetch;

describe('apiService', () => {
  let mockFetch;
  let mockResponse;
  let mockError;

  beforeEach(() => {
    mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ data: 'test' }),
      headers: {
        get: jest.fn().mockReturn('application/json')
      }
    };
    mockError = null;
    mockFetch = jest.fn().mockImplementation(() => {
      if (mockError) throw mockError;
      return Promise.resolve(mockResponse);
    });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
  });

  describe('GET requests', () => {
    it('should make GET request with default options', async () => {
      const result = await api.get('/test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should include auth header when token provided', async () => {
      const instance = createApiInstance('https://api.test.com', 'Bearer token123');
      await instance.get('/test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer token123' })
        })
      );
    });

    it('should handle query parameters', async () => {
      const instance = createApiInstance('https://api.test.com');
      await instance.get('/test', { params: { page: 1, limit: 10 } });
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test?page=1&limit=10',
        expect.any(Object)
      );
    });
  });

  describe('POST requests', () => {
    it('should make POST request with JSON body', async () => {
      const data = { name: 'test' };
      await api.post('/test', data);
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
          headers: expect.objectContaining({ 'Content-Type': 'application/json' })
        })
      );
    });

    it('should handle Blob body for file uploads', async () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      await api.post('/test', blob, { headers: { 'Content-Type': 'image/jpeg' } });
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          body: blob
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));
      
      await expect(api.get('/test')).rejects.toThrow('Network failure');
    });

    it('should handle HTTP error responses', async () => {
      mockResponse.ok = false;
      mockResponse.status = 404;
      mockResponse.json.mockResolvedValue({ message: 'Not found' });
      
      await expect(api.get('/test')).rejects.toThrow('HTTP 404');
    });

    it('should parse error response body', async () => {
      mockResponse.ok = false;
      mockResponse.status = 500;
      mockResponse.json.mockResolvedValue({ error: 'Server error' });
      
      await expect(api.get('/test')).rejects.toThrow('Server error');
    });
  });

  describe('Timeout handling', () => {
    it('should abort request on timeout', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );
      
      await expect(api.get('/test', { timeout: 1 })).rejects.toThrow();
    });
  });

  describe('Retry logic', () => {
    it('should not retry successful requests', async () => {
      await api.get('/test', { retries: 3 });
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse);
      
      const result = await api.get('/test', { retries: 3 });
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});