import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { fetch } from 'undici';

const BASE_URL = process.env.API_URL || 'http://localhost:8787';

const createTestUser = async () => {
  return {
    id: `test-user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
  };
};

const createAuthToken = async (env, user) => {
  const { generateToken } = await import('../services/auth.js');
  return generateToken(env, {
    sub: user.id,
    email: user.email,
    name: user.name,
  });
};

describe('Photo API Integration', () => {
  let testUser;
  let authToken;
  let env;

  beforeAll(async () => {
    env = {
      AUTH_SECRET: 'integration-test-secret-key-minimum-32',
      R2_BUCKET: {
        put: vi.fn().mockResolvedValue({ uploaded: true }),
        head: vi.fn().mockResolvedValue({ contentLength: 1024 }),
        delete: vi.fn().mockResolvedValue({ deleted: true }),
        get: vi.fn().mockResolvedValue({
          body: { pipe: () => {} },
        }),
      },
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
            all: vi.fn().mockResolvedValue([]),
            run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
          }),
        }),
      },
    };

    testUser = await createTestUser();
    authToken = await createAuthToken(env, testUser);
  });

  describe('GET /api/photos', () => {
    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/photos`);
      expect(response.status).toBe(401);
    });

    it('should return empty array for new user', async () => {
      const response = await fetch(`${BASE_URL}/api/photos`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.photos).toEqual([]);
    });
  });

  describe('POST /api/photos', () => {
    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'test.jpg' }),
      });
      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/photos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/photos/:id', () => {
    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/photos/non-existent-id`, {
        method: 'DELETE',
      });
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent photo', async () => {
      const response = await fetch(`${BASE_URL}/api/photos/non-existent-id`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });
});

describe('Auth API Integration', () => {
  describe('POST /api/auth/google', () => {
    it('should reject invalid token', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'invalid-token' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should reject missing refresh token', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/status', () => {
    it('should require valid token', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/status`, {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
    });
  });
});

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeTruthy();
  });
});