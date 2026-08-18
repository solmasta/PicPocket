import { Router } from 'itty-router';
import { authMiddleware } from './middleware/authMiddleware.js';
import { withParams } from 'itty-router-extras';
import { json } from './utils/response.js';
import { handlePhotos, handlePhotoFile } from './routes/photos.js';
import { handleAuth } from './routes/auth.js';
import { handleAlbums } from './routes/albums.js';
import { handleSearch } from './routes/search.js';

const router = Router();

// Auth routes
router.post('/api/auth/google', handleAuth);
router.post('/api/auth/logout', handleAuth);
router.get('/api/auth/verify', handleAuth);

// Protected routes
router.get('/api/photos', authMiddleware, handlePhotos);
router.post('/api/photos', authMiddleware, handlePhotos);
router.get('/api/photos/:id/file', authMiddleware, withParams, handlePhotoFile);
router.get('/api/photos/:id', authMiddleware, withParams, handlePhotos);
router.put('/api/photos/:id', authMiddleware, withParams, handlePhotos);
router.delete('/api/photos/:id', authMiddleware, withParams, handlePhotos);

router.get('/api/albums', authMiddleware, handleAlbums);
router.post('/api/albums', authMiddleware, handleAlbums);
router.get('/api/albums/:id', authMiddleware, withParams, handleAlbums);
router.put('/api/albums/:id', authMiddleware, withParams, handleAlbums);
router.delete('/api/albums/:id', authMiddleware, withParams, handleAlbums);
router.post('/api/albums/:id/photos', authMiddleware, withParams, handleAlbums);

router.get('/api/search', authMiddleware, handleSearch);

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

export async function handleApi(request, env) {
  // Add DB to request context
  request.env = env;

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
    return json({ error: 'Internal server error' }, 500, { headers: cors });
  }
}