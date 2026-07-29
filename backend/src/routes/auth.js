const express = require('express');
const config = require('../config/config');
const router = express.Router();

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

async function fetchGoogleProfile(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: 'Bearer ' + accessToken },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch Google profile');
  }
  const profile = await response.json();
  return {
    id: profile.sub,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
  };
}

/**
 * POST /api/auth/google/token
 * Exchanges a one-time authorization code (from the frontend's auth-code
 * sign-in flow) for a Google access token + refresh token. The refresh
 * token lets the frontend stay signed in past the access token's ~1hr
 * lifetime without prompting the user again.
 */
router.post('/google/token', async (req, res) => {
  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'code is required' });
  }
  if (!config.google.clientId || !config.google.clientSecret) {
    return res.status(500).json({ error: 'Google OAuth is not configured on the server' });
  }

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: 'postmessage',
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return res.status(401).json({ error: tokenData.error_description || 'Failed to exchange authorization code' });
    }

    const user = await fetchGoogleProfile(tokenData.access_token);

    res.json({
      user,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresIn: tokenData.expires_in,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/google/refresh
 * Exchanges a stored refresh token for a fresh access token, so the
 * frontend can renew its session silently instead of logging the user out.
 */
router.post('/google/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }
  if (!config.google.clientId || !config.google.clientSecret) {
    return res.status(500).json({ error: 'Google OAuth is not configured on the server' });
  }

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return res.status(401).json({ error: tokenData.error_description || 'Failed to refresh access token' });
    }

    res.json({
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/me
 * Returns current user info from token
 */
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const user = await fetchGoogleProfile(authHeader.slice(7));
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
