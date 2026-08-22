import { handleError, withErrorHandling, asyncWrapper, AppError, ErrorCodes, logError } from '../utils/errorHandler';

describe('errorHandler', () => {
  describe('AppError', () => {
    it('should create an AppError with all properties', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400, { field: 'test' });
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('AppError');
      expect(error.timestamp).toBeDefined();
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test', 'TEST', 500, { key: 'value' });
      const json = error.toJSON();
      expect(json.message).toBe('Test');
      expect(json.code).toBe('TEST');
      expect(json.statusCode).toBe(500);
      expect(json.details).toEqual({ key: 'value' });
      expect(json.name).toBe('AppError');
    });
  });

  describe('ErrorCodes', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ErrorCodes.AUTH_ERROR).toBe('AUTH_ERROR');
      expect(ErrorCodes.UPLOAD_ERROR).toBe('UPLOAD_ERROR');
      expect(ErrorCodes.STORAGE_ERROR).toBe('STORAGE_ERROR');
      expect(ErrorCodes.API_ERROR).toBe('API_ERROR');
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCodes.TIMEOUT_ERROR).toBe('TIMEOUT_ERROR');
    });
  });

  describe('handleError', () => {
    it('should return AppError as-is if already an AppError', () => {
      const original = new AppError('Already wrapped', 'ORIGINAL', 422);
      const result = handleError(original);
      expect(result).toBe(original);
    });

    it('should handle network fetch errors', () => {
      const fetchError = new TypeError('Failed to fetch');
      const result = handleError(fetchError, 'Custom fallback');
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toBe('Network request failed. Please check your connection.');
      expect(result.statusCode).toBe(0);
    });

    it('should handle AbortError as timeout', () => {
      const abortError = new DOMException('Aborted', 'AbortError');
      const result = handleError(abortError);
      expect(result.code).toBe('TIMEOUT_ERROR');
      expect(result.message).toBe('Request timed out. Please try again.');
    });

    it('should handle 401 as auth error', () => {
      const error = { response: { status: 401 }, message: 'Unauthorized' };
      const result = handleError(error);
      expect(result.code).toBe('AUTH_ERROR');
      expect(result.statusCode).toBe(401);
    });

    it('should handle 404 as not found', () => {
      const error = { response: { status: 404 }, message: 'Not found' };
      const result = handleError(error);
      expect(result.code).toBe('NOT_FOUND');
      expect(result.statusCode).toBe(404);
    });

    it('should handle 413 as upload error', () => {
      const error = { response: { status: 413 }, message: 'Payload too large' };
      const result = handleError(error);
      expect(result.code).toBe('UPLOAD_ERROR');
      expect(result.statusCode).toBe(413);
    });

    it('should use fallback message for unknown errors', () => {
      const error = new Error('Unknown error');
      const result = handleError(error, 'Custom fallback');
      expect(result.message).toBe('Custom fallback');
      expect(result.code).toBe('API_ERROR');
    });
  });

  describe('withErrorHandling', () => {
    it('should return data on success', async () => {
      const promise = Promise.resolve({ data: 'success' });
      const result = await withErrorHandling(promise, 'Failed');
      expect(result.data).toEqual({ data: 'success' });
      expect(result.error).toBeNull();
    });

    it('should return error on failure', async () => {
      const promise = Promise.reject(new Error('Test error'));
      const result = await withErrorHandling(promise, 'Custom message');
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Test error');
    });
  });

  describe('asyncWrapper', () => {
    it('should return data on success', async () => {
      const fn = () => Promise.resolve({ data: 'success' });
      const result = await asyncWrapper(fn, 'Failed');
      expect(result.data).toEqual({ data: 'success' });
      expect(result.error).toBeNull();
    });

    it('should return error on failure', async () => {
      const fn = () => Promise.reject(new Error('Async error'));
      const result = await asyncWrapper(fn, 'Custom message');
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      const result = logError('TestContext', error, { extra: 'data' });
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(result.context).toBe('TestContext');
      expect(result.message).toBe('Test error');
      expect(result.extra).toBe('data');
      expect(result.timestamp).toBeDefined();
      
      consoleSpy.mockRestore();
    });
  });
});