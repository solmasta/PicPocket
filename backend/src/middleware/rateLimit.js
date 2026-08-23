// Rate limiting middleware for Cloudflare Workers (itty-router)

// Simple in-memory store (use Redis or KV in production)
const requestCounts = new Map();
const RATE_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;
const UPLOAD_MAX = 10;

function getClientId(request) {
  // Cloudflare Workers use the Fetch API Headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const cfIp = request.headers.get('cf-connecting-ip');
  return cfIp || 'unknown';
}

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.windowStart > RATE_WINDOW) {
      requestCounts.delete(key);
    }
  }
}

/** Helper to set standard rate‑limit headers */
function setHeaders(res, limit, remaining, reset) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);
  }
}

/** General API rate limiter */
export function rateLimiter(request, response, next) {
  cleanupOldEntries();
  const clientId = getClientId(request);
  const now = Date.now();

  let data = requestCounts.get(clientId);
  if (!data || now - data.windowStart > RATE_WINDOW) {
    data = { windowStart: now, count: 0 };
    requestCounts.set(clientId, data);
  }

  data.count++;
  const remaining = Math.max(0, MAX_REQUESTS - data.count);
  const reset = Math.ceil((data.windowStart + RATE_WINDOW) / 1000);

  setHeaders(response, MAX_REQUESTS, remaining, reset);

  if (data.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((RATE_WINDOW - (now - data.windowStart)) / 1000);
    if (typeof response.setHeader === 'function') {
      response.setHeader('Retry-After', retryAfter.toString());
    }
    return next({ status: 429, code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' });
  }

  return next();
}

/** Stricter limiter for upload endpoints */
export function uploadRateLimiter(request, response, next) {
  cleanupOldEntries();
  const clientId = getClientId(request);
  const now = Date.now();
  const key = `upload:${clientId}`;

  let data = requestCounts.get(key);
  if (!data || now - data.windowStart > RATE_WINDOW) {
    data = { windowStart: now, count: 0 };
    requestCounts.set(key, data);
  }

  data.count++;
  const remaining = Math.max(0, UPLOAD_MAX - data.count);
  const reset = Math.ceil((data.windowStart + RATE_WINDOW) / 1000);

  setHeaders(response, UPLOAD_MAX, remaining, reset);

  if (data.count > UPLOAD_MAX) {
    const retryAfter = Math.ceil((RATE_WINDOW - (now - data.windowStart)) / 1000);
    if (typeof response.setHeader === 'function') {
      response.setHeader('Retry-After', retryAfter.toString());
    }
    return next({ status: 429, code: 'UPLOAD_RATE_LIMIT_EXCEEDED', message: 'Upload rate limit exceeded' });
  }

  return next();
}

export function clearRateLimit(clientId) {
  requestCounts.delete(clientId);
  requestCounts.delete(`upload:${clientId}`);
}

export function getRateLimitStatus(clientId) {
  const data = requestCounts.get(clientId) || requestCounts.get(`upload:${clientId}`);
  if (!data) {
    return { remaining: MAX_REQUESTS, reset: null };
  }
  const limit = clientId.startsWith('upload:') ? UPLOAD_MAX : MAX_REQUESTS;
  return {
    remaining: Math.max(0, limit - data.count),
    reset: Math.ceil((data.windowStart + RATE_WINDOW) / 1000),
  };
}
