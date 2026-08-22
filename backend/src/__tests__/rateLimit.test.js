import { rateLimiter, uploadRateLimiter, clearRateLimit, getRateLimitStatus } from '../middleware/rateLimit';

describe('rateLimit middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    };
    mockRes = {
      setHeader: jest.fn()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    clearRateLimit('127.0.0.1');
    clearRateLimit('upload:127.0.0.1');
  });

  describe('rateLimiter', () => {
    it('should allow requests under limit', () => {
      rateLimiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
    });

    it('should track request counts', () => {
      rateLimiter(mockReq, mockRes, mockNext);
      rateLimiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should block requests over limit', () => {
      for (let i = 0; i < 100; i++) {
        rateLimiter(mockReq, mockRes, mockNext);
      }

      rateLimiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED'
      }));
    });

    it('should set rate limit headers', () => {
      rateLimiter(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    });
  });

  describe('uploadRateLimiter', () => {
    it('should allow uploads under limit', () => {
      uploadRateLimiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should block uploads over limit', () => {
      for (let i = 0; i < 10; i++) {
        uploadRateLimiter(mockReq, mockRes, mockNext);
      }

      uploadRateLimiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        status: 429,
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
      }));
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return remaining requests', () => {
      const status = getRateLimitStatus('127.0.0.1');

      expect(status.remaining).toBe(100);
      expect(status.reset).toBeNull();
    });

    it('should track used requests', () => {
      rateLimiter(mockReq, mockRes, mockNext);
      rateLimiter(mockReq, mockRes, mockNext);

      const status = getRateLimitStatus('127.0.0.1');

      expect(status.remaining).toBe(98);
    });
  });
});