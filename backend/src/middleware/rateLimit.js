/**
 * Rate limiting middleware
 */

import { AppError } from '../utils/response';

// Simple in-memory store (use Redis in production)
const requestCounts = new Map();
const RATE_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

function getClientId(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.socket?.remoteAddress ||
         'unknown';
}

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.windowStart > RATE_WINDOW) {
      requestCounts.delete(key);
    }
  }
}

/**
 * General API rate limiter
 */
export function rateLimiter(req, res, next) {
  cleanupOldEntries();
  
  const clientId = getClientId(req);
  const now = Date.now();
  
  let clientData = requestCounts.get(clientId);
  
  if (!clientData || now - clientData.windowStart > RATE_WINDOW) {
    clientData = { windowStart: now, count: 0 };
    requestCounts.set(clientId, clientData);
  }
  
  clientData.count++;
  
  if (clientData.count > MAX_REQUESTS) {
    return next(new AppError(
      'Too many requests. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429,
      { retryAfter: Math.ceil((RATE_WINDOW - (now - clientData.windowStart)) / 1000) }
    ));
  }
  
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - clientData.count);
  res.setHeader('X-RateLimit-Reset', Math.ceil((clientData.windowStart + RATE_WINDOW) / 1000));
  
  next();
}

/**
 * Stricter rate limiter for upload endpoints
 */
export function uploadRateLimiter(req, res, next) {
  const UPLOAD_MAX = 10;
  cleanupOldEntries();
  
  const clientId = getClientId(req);
  const now = Date.now();
  
  let clientData = requestCounts.get(`upload:${clientId}`);
  
  if (!clientData || now - clientData.windowStart > RATE_WINDOW) {
    clientData = { windowStart: now, count: 0 };
    requestCounts.set(`upload:${clientId}`, clientData);
  }
  
  clientData.count++;
  
  if (clientData.count > UPLOAD_MAX) {
    return next(new AppError(
      'Upload rate limit exceeded. Please wait before uploading more files.',
      'UPLOAD_RATE_LIMIT_EXCEEDED',
      429,
      { retryAfter: Math.ceil((RATE_WINDOW - (now - clientData.windowStart)) / 1000) }
    ));
  }
  
  next();
}

/**
 * Clear rate limit data for a client
 */
export function clearRateLimit(clientId) {
  requestCounts.delete(clientId);
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(clientId) {
  const clientData = requestCounts.get(clientId);
  if (!clientData) {
    return { remaining: MAX_REQUESTS, reset: null };
  }
  
  return {
    remaining: Math.max(0, MAX_REQUESTS - clientData.count),
    reset: Math.ceil((clientData.windowStart + RATE_WINDOW) / 1000)
  };
}