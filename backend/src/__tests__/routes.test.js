import { describe, it, expect, beforeEach, vi } from 'vitest';

const createMockRequest = (options = {}) => {
  const headers = new Map();
  if (options.auth) {
    headers.set('Authorization', `Bearer ${options.auth}`);
  }
  if (options.contentType) {
    headers.set('Content-Type', options.contentType);
  }

  return {
    method: options.method || 'GET',
    url: new URL(options.url || 'http://localhost/api/test', 'http://localhost'),
    headers: {
      get: (key) => headers.get(key),
      has: (key) => headers.has(key),
    },
    json: options.json ? async () => options.json : async () => ({}),
    body: options.body,
    params: options.params || {},
    user: null,
  };
};

const createMockEnv = () => ({
  AUTH_SECRET: 'test-secret-key-for-testing-12345678901234567890',
  R2_BUCKET: {
    put: vi.fn().mockResolvedValue({}),
    head: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  DB: {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue([]),
        run: vi.fn().mockResolvedValue({ success: true }),
      }),
    }),
  },
  GOOGLE_CLIENT_ID: 'test-client-id',
  GOOGLE_CLIENT_SECRET: 'test-client-secret',
});

describe('Auth Middleware', () => {
  let authMiddleware;
  let requireAuth;
  let verifyToken;

  beforeEach(async () => {
    vi.resetModules();
    const authModule = await import('../middleware/auth.js');
    authMiddleware = authModule.authMiddleware;
    requireAuth = authModule.requireAuth;
  });

  describe('requireAuth', () => {
    it('should return 401 when no authorization header', async () => {
      const request = createMockRequest();
      const env = createMockEnv();

      const result = await requireAuth(request, env);

      expect(result).not.toBeNull();
      expect(result.status).toBe(401);
    });

    it('should return 401 for invalid bearer format', async () => {
      const request = createMockRequest({ auth: 'InvalidToken' });
      const env = createMockEnv();

      const result = await requireAuth(request, env);

      expect(result).not.toBeNull();
      expect(result.status).toBe(401);
    });

    it('should attach user to request on valid token', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      vi.doMock('../services/auth.js', () => ({
        verifyToken: vi.fn().mockResolvedValue(mockPayload),
      }));

      const request = createMockRequest({ auth: 'valid-token' });
      const env = createMockEnv();

      const result = await requireAuth(request, env);

      expect(result).toBeNull();
      expect(request.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should return 401 when token verification fails', async () => {
      vi.doMock('../services/auth.js', () => ({
        verifyToken: vi.fn().mockResolvedValue(null),
      }));

      const request = createMockRequest({ auth: 'invalid-token' });
      const env = createMockEnv();

      const result = await requireAuth(request, env);

      expect(result).not.toBeNull();
      expect(result.status).toBe(401);
    });
  });
});

describe('API Response Helpers', () => {
  let jsonResponse;
  let errorResponse;
  let withCors;

  beforeEach(async () => {
    const authModule = await import('../middleware/auth.js');
    jsonResponse = authModule.jsonResponse;
    errorResponse = authModule.errorResponse;
    withCors = authModule.withCors;
  });

  it('should create JSON response with correct headers', () => {
    const response = jsonResponse({ success: true }, 200);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should create error response with correct structure', () => {
    const response = errorResponse('Invalid input', 'VALIDATION_ERROR', 400);

    expect(response.status).toBe(400);
  });

  it('should add CORS headers to response', () => {
    const response = new Response('test', {
      headers: { 'Content-Type': 'text/plain' },
    });
    const result = withCors(response);

    expect(result.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

describe('CORS Configuration', () => {
  it('should allow common HTTP methods', () => {
    const { corsHeaders } = require('../middleware/auth.js');

    expect(corsHeaders['Access-Control-Allow-Methods']).toContain('GET');
    expect(corsHeaders['Access-Control-Allow-Methods']).toContain('POST');
    expect(corsHeaders['Access-Control-Allow-Methods']).toContain('PUT');
    expect(corsHeaders['Access-Control-Allow-Methods']).toContain('DELETE');
  });

  it('should allow authorization header', () => {
    const { corsHeaders } = require('../middleware/auth.js');

    expect(corsHeaders['Access-Control-Allow-Headers']).toContain('Authorization');
    expect(corsHeaders['Access-Control-Allow-Headers']).toContain('Content-Type');
  });
});