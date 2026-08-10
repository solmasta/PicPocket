import { Router } from 'itty-router';
import { verifyAuth } from './middleware/authMiddleware.js';
import { json, cors, withParams } from 'itty-router-extras';
import { handlePhotos } from './routes/photos.js';
import { handleAuth } from './routes/auth.js';
import { handleAlbums } from './routes/albums.js';

const router = Router();

// Add CORS headers to all responses
router.all('*', cors());

// Auth routes
router.post('/api/auth/google', handleAuth);
router.post('/api/auth/logout', handleAuth);
router.get('/api/auth/verify', handleAuth);

// Protected routes
router.get('/api/photos', verifyAuth, handlePhotos);
router.post('/api/photos', verifyAuth, handlePhotos);
router.get('/api/photos/:id', verifyAuth, withParams, handlePhotos);
router.put('/api/photos/:id', verifyAuth, withParams, handlePhotos);
router.delete('/api/photos/:id', verifyAuth, withParams, handlePhotos);

router.get('/api/albums', verifyAuth, handleAlbums);
router.post('/api/albums', verifyAuth, handleAlbums);
router.get('/api/albums/:id', verifyAuth, withParams, handleAlbums);
router.put('/api/albums/:id', verifyAuth, withParams, handleAlbums);
router.delete('/api/albums/:id', verifyAuth, withParams, handleAlbums);
router.post('/api/albums/:id/photos', verifyAuth, withParams, handleAlbums);

// 404 handler
router.all('*', () => new Response('Not Found', { status: 404 }));

export async function handleApi(request, env) {
  // Add DB to request context
  request.env = env;
  
  try {
    return await router.handle(request);
  } catch (error) {
    console.error('Error processing request:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}