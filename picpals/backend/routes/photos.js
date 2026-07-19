const express = require('express');
const multer = require('multer');
const path = require('path');
const { sessions } = require('./auth');
const { listGooglePhotos } = require('../services/googleApi');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// In-memory photo store (replace with a database in production)
const photos = new Map();

function authenticate(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = sessions.get(token);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  req.user = session;
  next();
}

// GET /api/photos
router.get('/', authenticate, (req, res) => {
  const userPhotos = [...photos.values()].filter((p) => p.userId === req.user.id);
  res.json(userPhotos);
});

// POST /api/photos
router.post('/', authenticate, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No photo file provided' });

  const id = Date.now().toString();
  const photo = {
    id,
    userId: req.user.id,
    name: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    url: '/api/photos/' + id + '/data',
    data: req.file.buffer,
    createdAt: new Date().toISOString(),
  };
  photos.set(id, photo);

  const { data: _data, ...photoMeta } = photo;
  res.status(201).json(photoMeta);
});

// GET /api/photos/:id/data — serve photo binary
router.get('/:id/data', authenticate, (req, res) => {
  const photo = photos.get(req.params.id);
  if (!photo || photo.userId !== req.user.id) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  res.set('Content-Type', photo.mimeType);
  res.send(photo.data);
});

// DELETE /api/photos/:id
router.delete('/:id', authenticate, (req, res) => {
  const photo = photos.get(req.params.id);
  if (!photo || photo.userId !== req.user.id) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  photos.delete(req.params.id);
  res.json({ message: 'Photo deleted' });
});

// POST /api/photos/sync — import from Google Photos
router.post('/sync', authenticate, async (req, res) => {
  try {
    const result = await listGooglePhotos(req.user.googleAccessToken);
    const items = result.mediaItems || [];
    const imported = items.map((item) => ({
      id: 'gp-' + item.id,
      userId: req.user.id,
      name: item.filename,
      url: item.baseUrl,
      source: 'google_photos',
      createdAt: item.mediaMetadata?.creationTime || new Date().toISOString(),
    }));
    imported.forEach((p) => photos.set(p.id, p));
    res.json({ imported: imported.length });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Failed to sync Google Photos' });
  }
});

module.exports = router;
