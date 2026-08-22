import { Router } from 'itty-router';
import { authMiddleware } from './middleware/authMiddleware.js';
import { withParams } from 'itty-router-extras';
import { json } from './utils/response.js';
import { handlePhotos, handlePhotoFile } from './routes/photos.js';
import { handleAuth } from './routes/auth.js';
import { handleAlbums } from './routes/albums.js';
import { handleSearch } from './routes/search.js';
import { handleAnalyzePhoto, handleStorageInsights } from './routes/ai.js';
import { rateLimiter, uploadRateLimiter } from './middleware/rateLimit.js';
import { validatePhotoUpload, validatePhotoUpdate, validateSearchParams, sanitizeInput } from './middleware/validation.js';

const router = Router();

// Auth routes
router.post('/api/auth/google', rateLimiter, handleAuth);
router.post('/api/auth/logout', rateLimiter, handleAuth);
router.get('/api/auth/verify', rateLimiter, handleAuth);

// Protected routes with rate limiting
router.get('/api/photos', rateLimiter, authMiddleware, handlePhotos);
router.post('/api/photos', uploadRateLimiter, authMiddleware, validatePhotoUpload, handlePhotos);
router.get('/api/photos/:id/file', rateLimiter, authMiddleware, withParams, handlePhotoFile);
router.get('/api/photos/:id', rateLimiter, authMiddleware, withParams, handlePhotos);
router.put('/api/photos/:id', rateLimiter, authMiddleware, validatePhotoUpdate, handlePhotos);
router.delete('/api/photos/:id', rateLimiter, authMiddleware, withParams, handlePhotos);

router.get('/api/albums', rateLimiter, authMiddleware, handleAlbums);
router.post('/api/albums', rateLimiter, authMiddleware, handleAlbums);
router.get('/api/albums/:id', rateLimiter, authMiddleware, withParams, handleAlbums);
router.put('/api/albums/:id', rateLimiter, authMiddleware, withParams, handleAlbums);
router.delete('/api/albums/:id', rateLimiter, authMiddleware, withParams, handleAlbums);
router.post('/api/albums/:id/photos', rateLimiter, authMiddleware, withParams, handleAlbums);

router.get('/api/search', rateLimiter, authMiddleware, validateSearchParams, handleSearch);

// Unauthenticated AI endpoints with rate limiting
router.post('/api/ai/analyze', rateLimiter, handleAnalyzePhoto);
router.post('/api/ai/storage-insights', rateLimiter, handleStorageInsights);

// 404 handler
router.all('*', () => new Response('Not Found', { status: 404 }));

function corsHeaders(request, env) {
  const allowedOrigins = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000'];

  const requestOrigin = request.headers.get('Origin');
  const allowOrigin =
    allowedOrigins.includes('*') || allowedOrigins.includes(requestOrigin)
      ? requestOrigin || '*'
      : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

function getClientIP(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('cf-connecting-ip') ||
         request.socket?.remoteAddress ||
         'unknown';
}

export async function handleApi(request, env) {
  // Add DB and context to request
  request.env = env;
  request.clientIP = getClientIP(request);

  // Sanitize input body if present
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const body = await request.json();
        request.body = sanitizeInput(body);
      }
    } catch (e) {
      // Let route handlers deal with malformed JSON
    }
  }

  const cors = corsHeaders(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  // Add performance tracking
  const startTime = Date.now();
  const requestMethod = request.method;
  const requestUrl = new URL(request.url).pathname;

  try {
    const response = await router.handle(request);

    // Add performance metrics and CORS headers
    const duration = Date.now() - startTime;
    response.headers.set('Server-Timing', `app;dur=${duration}`);
    for (const [key, value] of Object.entries(cors)) {
      response.headers.set(key, value);
    }

    // Log slow requests
    if (duration > 1000) {
      console.warn(`[PERFORMANCE] Slow request: ${requestMethod} ${requestUrl} took ${duration}ms`);
    }

    return response;
  } catch (error) {
    console.error('Error processing request:', error);
    return json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }, 500, { headers: cors });
  }
}