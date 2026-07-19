const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// In-memory tag store
const tagStore = new Map();

/**
 * GET /api/tags
 * List all tags for the authenticated user
 */
router.get('/', authMiddleware, (req, res) => {
  const userTags = [];
  for (const tag of tagStore.values()) {
    if (tag.userId === req.user.id) {
      userTags.push(tag);
    }
  }
  userTags.sort((a, b) => b.count - a.count);
  res.json(userTags);
});

/**
 * GET /api/tags/search?tag=<tag>
 * Search photos by tag
 */
router.get('/search', authMiddleware, (req, res) => {
  const { tag } = req.query;
  if (!tag) {
    return res.status(400).json({ error: 'tag query parameter is required' });
  }
  // Return matching tag info
  const key = `${req.user.id}:${tag}`;
  const tagData = tagStore.get(key);
  res.json(tagData || { tag, count: 0 });
});

/**
 * POST /api/tags
 * Record that a tag was used
 */
router.post('/', authMiddleware, (req, res) => {
  const { tag } = req.body;
  if (!tag) {
    return res.status(400).json({ error: 'tag is required' });
  }
  const key = `${req.user.id}:${tag}`;
  const existing = tagStore.get(key) || { userId: req.user.id, tag, count: 0 };
  existing.count += 1;
  tagStore.set(key, existing);
  res.json(existing);
});

module.exports = router;
