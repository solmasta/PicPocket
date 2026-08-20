import { describe, it, expect, beforeEach, vi } from 'vitest';

const createMockEnv = () => ({
  AUTH_SECRET: 'test-secret-key-minimum-32-chars-long',
  R2_BUCKET: {
    put: vi.fn().mockResolvedValue({ uploaded: true }),
    head: vi.fn().mockResolvedValue({ contentLength: 1024 }),
    delete: vi.fn().mockResolvedValue({ deleted: true }),
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
});

describe('Storage Service', () => {
  let storage;

  beforeEach(async () => {
    vi.resetModules();
    storage = await import('../services/storage.js');
  });

  describe('uploadPhoto', () => {
    it('should upload photo to R2 bucket', async () => {
      const env = createMockEnv();
      const photoData = new Uint8Array([1, 2, 3, 4]);
      const filename = 'test-photo.jpg';
      const userId = 'user-123';

      const result = await storage.uploadPhoto(env, photoData, filename, userId);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('filename');
      expect(env.R2_BUCKET.put).toHaveBeenCalled();
    });

    it('should generate unique filename with user prefix', async () => {
      const env = createMockEnv();
      const photoData = new Uint8Array([1, 2, 3]);
      const filename = 'photo.jpg';
      const userId = 'user-456';

      await storage.uploadPhoto(env, photoData, filename, userId);

      const callArg = env.R2_BUCKET.put.mock.calls[0];
      expect(callArg[0]).toContain(`user-456/`);
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo from R2 bucket', async () => {
      const env = createMockEnv();
      const key = 'user-123/photo-uuid.jpg';

      await storage.deletePhoto(env, key);

      expect(env.R2_BUCKET.delete).toHaveBeenCalledWith(key);
    });
  });

  describe('getPhotoUrl', () => {
    it('should generate correct R2 URL', () => {
      const env = { R2_BUCKET_URL: 'https://r2.example.com' };
      const key = 'user-123/photo.jpg';

      const url = storage.getPhotoUrl(env, key);

      expect(url).toContain(key);
    });

    it('should handle empty key gracefully', () => {
      const env = { R2_BUCKET_URL: 'https://r2.example.com' };

      const url = storage.getPhotoUrl(env, '');

      expect(url).toBeNull();
    });
  });
});

describe('Database Service', () => {
  let db;

  beforeEach(async () => {
    vi.resetModules();
    db = await import('../services/database.js');
  });

  describe('savePhoto', () => {
    it('should save photo metadata to database', async () => {
      const env = createMockEnv();
      const photo = {
        id: 'photo-uuid',
        userId: 'user-123',
        filename: 'test.jpg',
        url: 'https://r2.example.com/path',
        timestamp: Date.now(),
      };

      await db.savePhoto(env, photo);

      expect(env.DB.prepare).toHaveBeenCalled();
    });
  });

  describe('getPhotos', () => {
    it('should retrieve user photos from database', async () => {
      const env = createMockEnv();
      const userId = 'user-123';
      const mockPhotos = [
        { id: 'photo-1', filename: 'a.jpg' },
        { id: 'photo-2', filename: 'b.jpg' },
      ];

      env.DB.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue(mockPhotos),
        }),
      });

      const photos = await db.getPhotos(env, userId);

      expect(photos).toEqual(mockPhotos);
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo from database', async () => {
      const env = createMockEnv();
      const photoId = 'photo-uuid';
      const userId = 'user-123';

      await db.deletePhoto(env, photoId, userId);

      expect(env.DB.prepare).toHaveBeenCalled();
    });
  });
});

describe('Auth Service', () => {
  let auth;

  beforeEach(async () => {
    vi.resetModules();
    auth = await import('../services/auth.js');
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', async () => {
      const env = createMockEnv();
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
      };

      const token = await auth.generateToken(env, payload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include all payload fields in token', async () => {
      const env = createMockEnv();
      const payload = {
        sub: 'user-456',
        email: 'user@example.com',
        name: 'Test User',
      };

      const token = await auth.generateToken(env, payload);
      const verified = await auth.verifyToken(token, env);

      expect(verified.sub).toBe('user-456');
      expect(verified.email).toBe('user@example.com');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const env = createMockEnv();
      const payload = { sub: 'user-789', email: 'verify@test.com' };

      const token = await auth.generateToken(env, payload);
      const verified = await auth.verifyToken(token, env);

      expect(verified).not.toBeNull();
      expect(verified.sub).toBe('user-789');
    });

    it('should return null for invalid token', async () => {
      const env = createMockEnv();

      const verified = await auth.verifyToken('invalid.token.here', env);

      expect(verified).toBeNull();
    });

    it('should return null for expired token', async () => {
      const env = createMockEnv();
      const payload = {
        sub: 'user-expired',
        email: 'expired@test.com',
        exp: Math.floor(Date.now() / 1000) - 3600,
      };

      const token = await auth.generateToken(env, payload);
      const verified = await auth.verifyToken(token, env);

      expect(verified).toBeNull();
    });
  });
});