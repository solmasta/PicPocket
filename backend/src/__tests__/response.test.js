import { json, error, asyncHandler, ErrorCodes } from '../utils/response.js';

describe('response utilities', () => {
  describe('json', () => {
    it('should create a Response with JSON body', () => {
      const response = json({ data: 'test' });
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should accept custom status code', () => {
      const response = json({ data: 'created' }, 201);
      expect(response.status).toBe(201);
    });
  });

  describe('error', () => {
    it('should create error response with all properties', () => {
      const response = error('Not found', 404, 'NOT_FOUND', { id: 123 });
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(404);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include timestamp in error response', async () => {
      const response = error('Test error', 500);
      const body = await response.json();
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('ErrorCodes', () => {
    it('should have BAD_REQUEST with 400 status', () => {
      expect(ErrorCodes.BAD_REQUEST.code).toBe('BAD_REQUEST');
      expect(ErrorCodes.BAD_REQUEST.status).toBe(400);
    });

    it('should have UNAUTHORIZED with 401 status', () => {
      expect(ErrorCodes.UNAUTHORIZED.code).toBe('UNAUTHORIZED');
      expect(ErrorCodes.UNAUTHORIZED.status).toBe(401);
    });

    it('should have FORBIDDEN with 403 status', () => {
      expect(ErrorCodes.FORBIDDEN.code).toBe('FORBIDDEN');
      expect(ErrorCodes.FORBIDDEN.status).toBe(403);
    });

    it('should have NOT_FOUND with 404 status', () => {
      expect(ErrorCodes.NOT_FOUND.code).toBe('NOT_FOUND');
      expect(ErrorCodes.NOT_FOUND.status).toBe(404);
    });

    it('should have PAYLOAD_TOO_LARGE with 413 status', () => {
      expect(ErrorCodes.PAYLOAD_TOO_LARGE.code).toBe('PAYLOAD_TOO_LARGE');
      expect(ErrorCodes.PAYLOAD_TOO_LARGE.status).toBe(413);
    });

    it('should have INTERNAL_ERROR with 500 status', () => {
      expect(ErrorCodes.INTERNAL_ERROR.code).toBe('INTERNAL_ERROR');
      expect(ErrorCodes.INTERNAL_ERROR.status).toBe(500);
    });
  });

  describe('asyncHandler', () => {
    it('should return result of successful handler', async () => {
      const handler = jest.fn().mockResolvedValue(json({ success: true }));
      const wrapped = asyncHandler(handler);
      const response = await wrapped();
      expect(handler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should catch and format errors from handler', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Test error'));
      const wrapped = asyncHandler(handler, 'TestHandler');
      const response = await wrapped();
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Test error');
      expect(body.code).toBe('INTERNAL_ERROR');
    });
  });
});