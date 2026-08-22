import { validatePhotoUpload, validatePhotoUpdate, validateSearchParams } from '../middleware/validation';
import { AppError } from '../utils/response';

describe('validation middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { body: {}, query: {}, params: {} };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('validatePhotoUpload', () => {
    it('should pass valid upload', () => {
      mockReq.body = {
        fileName: 'test.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024,
        contentHash: 'abc123'
      };

      validatePhotoUpload(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject missing fileName', () => {
      mockReq.body = {
        fileType: 'image/jpeg',
        fileSize: 1024
      };

      validatePhotoUpload(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should reject invalid file type', () => {
      mockReq.body = {
        fileName: 'test.txt',
        fileType: 'text/plain',
        fileSize: 1024
      };

      validatePhotoUpload(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should reject file too large', () => {
      mockReq.body = {
        fileName: 'test.jpg',
        fileType: 'image/jpeg',
        fileSize: 200 * 1024 * 1024
      };

      validatePhotoUpload(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('validatePhotoUpdate', () => {
    it('should pass valid update', () => {
      mockReq.body = { tags: ['test'] };

      validatePhotoUpdate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid tag format', () => {
      mockReq.body = { tags: 'not-an-array' };

      validatePhotoUpdate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should reject tags with invalid characters', () => {
      mockReq.body = { tags: ['tag with spaces'] };

      validatePhotoUpdate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('validateSearchParams', () => {
    it('should pass valid search params', () => {
      mockReq.query = { q: 'nature', page: '1', limit: '20' };

      validateSearchParams(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should apply defaults for missing params', () => {
      mockReq.query = {};

      validateSearchParams(mockReq, mockRes, mockNext);

      expect(mockReq.query.page).toBe('1');
      expect(mockReq.query.limit).toBe('50');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid page number', () => {
      mockReq.query = { page: '0' };

      validateSearchParams(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should reject limit exceeding max', () => {
      mockReq.query = { limit: '500' };

      validateSearchParams(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});