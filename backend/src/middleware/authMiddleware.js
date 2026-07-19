const { verifyGoogleToken } = require('../services/googleService');

/**
 * Middleware to verify Google OAuth bearer token
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    // For access tokens (not ID tokens), verify via Google userinfo endpoint
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + token },
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }

    const userInfo = await response.json();
    req.user = {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      accessToken: token,
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

module.exports = authMiddleware;
