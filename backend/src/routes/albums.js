const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// In-memory store
const albumStore = new Map();

/**
 * GET /api/albums
 */
router.get('/', authMiddleware, (req, res) => {
  const userAlbums = [];
  for (const album of albumStore.values()) {
    if (album.userId === req.user.id) {
      userAlbums.push(album);
    }
  }
  res.json(userAlbums);
});

/**
 * POST /api/albums
 */
router.post('/', authMiddleware, (req, res) => {
  const { name, photos, isPublic } = req.body;
  if (!name || !Array.isArray(photos)) {
    return res.status(400).json({ error: 'name and photos are required' });
  }

  const album = {
    id: uuidv4(),
    userId: req.user.id,
    name,
    photos,
    isPublic: Boolean(isPublic),
    createdAt: new Date().toISOString(),
    shareToken: uuidv4(),
  };

  albumStore.set(album.id, album);
  res.status(201).json(album);
});

/**
 * PATCH /api/albums/:id
 */
router.patch('/:id', authMiddleware, (req, res) => {
  const album = albumStore.get(req.params.id);
  if (!album) return res.status(404).json({ error: 'Album not found' });
  if (album.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const allowed = ['name', 'photos', 'isPublic'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      album[key] = req.body[key];
    }
  });
  albumStore.set(album.id, album);
  res.json(album);
});

/**
 * DELETE /api/albums/:id
 */
router.delete('/:id', authMiddleware, (req, res) => {
  const album = albumStore.get(req.params.id);
  if (!album) return res.status(404).json({ error: 'Album not found' });
  if (album.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  albumStore.delete(req.params.id);
  res.status(204).send();
});

/**
 * GET /api/albums/share/:shareToken
 * Public endpoint for shared albums
 */
router.get('/share/:shareToken', (req, res) => {
  for (const album of albumStore.values()) {
    if (album.shareToken === req.params.shareToken) {
      if (!album.isPublic) {
        return res.status(403).json({ error: 'This album is private' });
      }
      return res.json({ name: album.name, photos: album.photos });
    }
  }
  res.status(404).json({ error: 'Album not found' });
});

module.exports = router;
