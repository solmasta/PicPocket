'use strict';

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const { getAuthUrl, exchangeCodeForTokens, revokeTokens } = require('./auth');

const app = express();
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || (() => { throw new Error('SESSION_SECRET env variable is required'); })(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,         // inaccessible to JavaScript (prevents XSS token theft)
      secure: process.env.NODE_ENV === 'production', // HTTPS-only in production
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// ─── Auth routes ─────────────────────────────────────────────────────────────

/** Redirect user to Google's OAuth2 consent screen */
app.get('/auth/google', (_req, res) => {
  res.redirect(getAuthUrl());
});

/** Google redirects here with an authorization code */
app.get('/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    return res.status(400).json({ error: `OAuth error: ${error}` });
  }
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    const { userId, email } = await exchangeCodeForTokens(String(code));
    // Store only the user ID in the session — never the tokens themselves.
    req.session.userId = userId;
    req.session.email = email;
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  } catch (err) {
    console.error('Token exchange failed:', err.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/** Returns the currently logged-in user (or 401) */
app.get('/auth/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ userId: req.session.userId, email: req.session.email });
});

/** Logout: revoke tokens and destroy the session */
app.post('/auth/logout', async (req, res) => {
  const { userId } = req.session;
  if (userId) {
    await revokeTokens(userId);
  }
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

module.exports = app;
