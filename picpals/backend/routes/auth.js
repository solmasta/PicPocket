const express = require('express');
const crypto = require('crypto');
const { getGoogleUserInfo } = require('../services/googleApi');

const router = express.Router();

// In-memory token store (replace with a database in production)
const sessions = new Map();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: 'accessToken is required' });
  }

  try {
    const userInfo = await getGoogleUserInfo(accessToken);
    const token = generateToken();
    sessions.set(token, {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      googleAccessToken: accessToken,
      createdAt: Date.now(),
    });

    res.json({
      token,
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = sessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  const newToken = generateToken();
  sessions.set(newToken, { ...session });
  sessions.delete(token);
  res.json({ token: newToken });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  sessions.delete(token);
  res.json({ message: 'Logged out' });
});

module.exports = router;
module.exports.sessions = sessions;
