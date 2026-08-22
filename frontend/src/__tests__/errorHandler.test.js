import { AppError, handleError, formatErrorMessage, getErrorCode } from '../utils/errorHandler';

describe('errorHandler', () => {
  describe('AppError', () => {
    it('should create an error with code and status', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.status).toBe(400);
      expect(error instanceof Error).toBe(true);
    });

    it('should default to 500 status', () => {
      const error = new AppError('Test error', 'TEST_ERROR');
      expect(error.status).toBe(500);
    });

    it('should preserve additional properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400, { field: 'test' });
      expect(error.field).toBe('test');
    });
  });

  describe('handleError', () => {
    it('should return AppError as-is', () => {
      const appError = new AppError('App error', 'APP_ERROR', 400);
      const result = handleError(appError);
      expect(result).toBe(appError);
    });

    it('should convert Error to AppError', () => {
      const error = new Error('Regular error');
      const result = handleError(error);
      expect(result instanceof AppError).toBe(true);
      expect(result.message).toBe('Regular error');
      expect(result.code).toBe('UNKNOWN');
    });

    it('should handle string errors', () => {
      const result = handleError('String error');
      expect(result instanceof AppError).toBe(true);
      expect(result.message).toBe('String error');
    });

    it('should handle null/undefined', () => {
      const nullResult = handleError(null);
      expect(nullResult instanceof AppError).toBe(true);
      expect(nullResult.message).toBe('An unknown error occurred');

      const undefResult = handleError(undefined);
      expect(undefResult instanceof AppError).toBe(true);
      expect(undefResult.message).toBe('An unknown error occurred');
    });
  });

  describe('getErrorCode', () => {
    it('should extract code from AppError', () => {
      const error = new AppError('Test', 'SPECIFIC_CODE', 400);
      expect(getErrorCode(error)).toBe('SPECIFIC_CODE');
    });

    it('should return UNKNOWN for regular errors', () => {
      const error = new Error('Test');
      expect(getErrorCode(error)).toBe('UNKNOWN');
    });

    it('should handle string errors', () => {
      expect(getErrorCode('Test')).toBe('UNKNOWN');
    });

    it('should handle invalid input', () => {
      expect(getErrorCode(null)).toBe('UNKNOWN');
      expect(getErrorCode(undefined)).toBe('UNKNOWN');
      expect(getErrorCode(123)).toBe('UNKNOWN');
    });
  });

  describe('formatErrorMessage', () => {
    it('should format AppError message', () => {
      const error = new AppError('Custom message', 'CUSTOM', 400);
      expect(formatErrorMessage(error)).toBe('Custom message');
    });

    it('should handle network errors', () => {
      const error = new Error('Network request failed');
      error.code = 'ECONNREFUSED';
      expect(formatErrorMessage(error)).toContain('Network');
    });

    it('should handle timeout errors', () => {
      const error = new Error('Request timeout');
      expect(formatErrorMessage(error)).toContain('timeout');
    });

    it('should return unknown message for invalid input', () => {
      expect(formatErrorMessage(null)).toBe('An unknown error occurred');
      expect(formatErrorMessage(undefined)).toBe('An unknown error occurred');
    });
  });
});