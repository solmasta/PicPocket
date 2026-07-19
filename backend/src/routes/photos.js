const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

// In-memory store for demonstration (replace with a database in production)
const photoStore = new Map();

/**
 * GET /api/photos
 * List user's photos
 */
router.get('/', authMiddleware, (req, res) => {
  const userPhotos = [];
  for (const photo of photoStore.values()) {
    if (photo.userId === req.user.id) {
      userPhotos.push(photo);
    }
  }
  userPhotos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  res.json(userPhotos);
});

/**
 * POST /api/photos/upload
 * Upload a new photo
 */
router.post('/upload', authMiddleware, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No photo file provided' });
  }

  const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
  const location = req.body.location ? JSON.parse(req.body.location) : null;

  const photo = {
    id: uuidv4(),
    userId: req.user.id,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    uploadDate: new Date().toISOString(),
    tags,
    location,
    filter: 'none',
    isPublic: false,
    cloudBackup: { googlePhotos: null, googleDrive: null },
    // Note: In production, store the file in cloud storage and save the URL
    dataBuffer: req.file.buffer.toString('base64'),
  };

  photoStore.set(photo.id, photo);
  res.status(201).json({ id: photo.id, fileName: photo.fileName, uploadDate: photo.uploadDate });
});

/**
 * PATCH /api/photos/:id
 * Update photo metadata (tags, filter, isPublic, etc.)
 */
router.patch('/:id', authMiddleware, (req, res) => {
  const photo = photoStore.get(req.params.id);
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  if (photo.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const allowed = ['tags', 'filter', 'isPublic', 'location', 'cloudBackup'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      photo[key] = req.body[key];
    }
  });
  photoStore.set(photo.id, photo);
  res.json({ id: photo.id });
});

/**
 * DELETE /api/photos/:id
 * Delete a photo
 */
router.delete('/:id', authMiddleware, (req, res) => {
  const photo = photoStore.get(req.params.id);
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  if (photo.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  photoStore.delete(req.params.id);
  res.status(204).send();
});

module.exports = router;
