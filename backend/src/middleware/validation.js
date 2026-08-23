/**
 * Input validation middleware
 */

import { AppError } from '../utils/response';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_SEARCH_LIMIT = 100;
const TAG_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Validate photo upload request
 */
export function validatePhotoUpload(req, res, next) {
  const { fileName, fileType, fileSize, contentHash } = req.body;

  const errors = [];

  if (!fileName || typeof fileName !== 'string') {
    errors.push('fileName is required');
  }

  if (!fileType || !ALLOWED_IMAGE_TYPES.includes(fileType)) {
    errors.push(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }

  if (!fileSize || fileSize > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  if (!contentHash || typeof contentHash !== 'string') {
    errors.push('contentHash is required');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 'VALIDATION_ERROR', 400));
  }

  next();
}

/**
 * Validate photo update request
 */
export function validatePhotoUpdate(req, res, next) {
  const { tags, location, caption } = req.body;

  const errors = [];

  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      errors.push('tags must be an array');
    } else {
      const invalidTags = tags.filter(tag => !TAG_REGEX.test(tag));
      if (invalidTags.length > 0) {
        errors.push(`Invalid tags: ${invalidTags.join(', ')}. Use alphanumeric characters, underscores, and hyphens only.`);
      }
    }
  }

  if (location !== undefined) {
    if (typeof location !== 'object' || location === null) {
      errors.push('location must be an object');
    } else if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      errors.push('location must have latitude and longitude as numbers');
    }
  }

  if (caption !== undefined && typeof caption !== 'string') {
    errors.push('caption must be a string');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 'VALIDATION_ERROR', 400));
  }

  next();
}

/**
 * Validate search parameters
 */
export function validateSearchParams(req, res, next) {
  const { q, page, limit, sortBy, sortOrder, tags, source, dateFrom, dateTo } = req.query;

  const errors = [];

  // Apply defaults
  req.query.page = page || '1';
  req.query.limit = limit || '50';
  req.query.sortBy = sortBy || 'uploadDate';
  req.query.sortOrder = sortOrder || 'desc';

  const pageNum = parseInt(req.query.page, 10);
  const limitNum = parseInt(req.query.limit, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    errors.push('page must be a positive integer');
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > MAX_SEARCH_LIMIT) {
    errors.push(`limit must be between 1 and ${MAX_SEARCH_LIMIT}`);
  }

  if (sortBy && !['uploadDate', 'fileName', 'fileSize', 'fileType'].includes(sortBy)) {
    errors.push('Invalid sortBy field');
  }

  if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
    errors.push('sortOrder must be asc or desc');
  }

  if (tags && typeof tags === 'string') {
    req.query.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 'VALIDATION_ERROR', 400));
  }

  next();
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}