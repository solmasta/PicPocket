const express = require('express');
const { sessions } = require('./auth');

const router = express.Router();

// In-memory horse store (replace with a database in production)
const horses = new Map();

function authenticate(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = sessions.get(token);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  req.user = session;
  next();
}

// GET /api/horses
router.get('/', authenticate, (req, res) => {
  const userHorses = [...horses.values()].filter((h) => h.ownerId === req.user.id);
  res.json(userHorses);
});

// GET /api/horses/:id
router.get('/:id', authenticate, (req, res) => {
  const horse = horses.get(req.params.id);
  if (!horse || horse.ownerId !== req.user.id) {
    return res.status(404).json({ error: 'Horse not found' });
  }
  res.json(horse);
});

// POST /api/horses
router.post('/', authenticate, (req, res) => {
  const { name, breed, age, photoUrl, features } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const id = Date.now().toString();
  const horse = {
    id,
    ownerId: req.user.id,
    owner: req.user.name,
    name,
    breed: breed || '',
    age: age || null,
    photoUrl: photoUrl || null,
    features: features || [],
    createdAt: new Date().toISOString(),
  };
  horses.set(id, horse);
  res.status(201).json(horse);
});

// PUT /api/horses/:id
router.put('/:id', authenticate, (req, res) => {
  const horse = horses.get(req.params.id);
  if (!horse || horse.ownerId !== req.user.id) {
    return res.status(404).json({ error: 'Horse not found' });
  }
  const { name, breed, age, photoUrl, features } = req.body;
  const updated = {
    ...horse,
    name: name ?? horse.name,
    breed: breed ?? horse.breed,
    age: age ?? horse.age,
    photoUrl: photoUrl ?? horse.photoUrl,
    features: features ?? horse.features,
    updatedAt: new Date().toISOString(),
  };
  horses.set(req.params.id, updated);
  res.json(updated);
});

// DELETE /api/horses/:id
router.delete('/:id', authenticate, (req, res) => {
  const horse = horses.get(req.params.id);
  if (!horse || horse.ownerId !== req.user.id) {
    return res.status(404).json({ error: 'Horse not found' });
  }
  horses.delete(req.params.id);
  res.json({ message: 'Horse deleted' });
});

module.exports = router;
