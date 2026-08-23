// Rate limiting middleware for Cloudflare Workers (itty-router)

// Simple in-memory store (use Redis or KV in production)
const requestCounts = new Map();
const RATE_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

function getClientId(request) {
  // Cloudflare Workers use the Fetch API Headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // Fallback to Cloudflare connecting IP header
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

/**
 * General API rate limiter
 * Returns a Response when limit is exceeded, otherwise passes through.
 */
export function rateLimiter(request, ...rest) {
  cleanupOldEntries();
  const clientId = getClientId(request);
  const now = Date.now();

  let clientData = requestCounts.get(clientId);
  if (!clientData || now - clientData.windowStart > RATE_WINDOW) {
    clientData = { windowStart: now, count: 0 };
    requestCounts.set(clientId, clientData);
  }

  clientData.count++;
  if (clientData.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((RATE_WINDOW - (now - clientData.windowStart)) / 1000);
    return new Response(JSON.stringify({ error: 'Too many requests', retryAfter }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    });
  }
  // Continue to next handler
  return undefined;
}

/**
 * Stricter rate limiter for upload endpoints
 */
export function uploadRateLimiter(request, ...rest) {
  const UPLOAD_MAX = 10;
  cleanupOldEntries();
  const clientId = getClientId(request);
  const now = Date.now();

  const key = `upload:${clientId}`;
  let clientData = requestCounts.get(key);
  if (!clientData || now - clientData.windowStart > RATE_WINDOW) {
    clientData = { windowStart: now, count: 0 };
    requestCounts.set(key, clientData);
  }

  clientData.count++;
  if (clientData.count > UPLOAD_MAX) {
    const retryAfter = Math.ceil((RATE_WINDOW - (now - clientData.windowStart)) / 1000);
    return new Response(JSON.stringify({ error: 'Upload rate limit exceeded', retryAfter }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    });
  }
  return undefined;
}

export function clearRateLimit(clientId) {
  requestCounts.delete(clientId);
}

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
