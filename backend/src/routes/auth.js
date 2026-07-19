const express = require('express');
const router = express.Router();

/**
 * GET /api/auth/me
 * Returns current user info from token
 */
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + token },
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userInfo = await response.json();
    res.json({
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
