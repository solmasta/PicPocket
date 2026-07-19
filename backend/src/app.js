'use strict';

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { doubleCsrf } = require('csrf-csrf');
const { getAuthUrl, exchangeCodeForTokens, revokeTokens } = require('./auth');

const app = express();
app.use(express.json());
app.use(cookieParser());

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

// ─── CSRF protection (Double Submit Cookie pattern) ───────────────────────────
// Applied globally — doubleCsrfProtection is a no-op for safe methods (GET/HEAD/OPTIONS).

const isProduction = process.env.NODE_ENV === 'production';

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () =>
    process.env.SESSION_SECRET ||
    (() => { throw new Error('SESSION_SECRET env variable is required'); })(),
  // Use the session ID as the per-request identifier (requires express-session).
  getSessionIdentifier: (req) => req.sessionID,
  // Use __Host- prefix in production (requires HTTPS); plain name in dev/test.
  cookieName: isProduction ? '__Host-x-csrf-token' : 'x-csrf-token',
  cookieOptions: {
    httpOnly: false, // must be readable by the browser for the double-submit pattern
    secure: isProduction,
    sameSite: 'lax',
  },
});

app.use(doubleCsrfProtection);

/** Exposes a CSRF token that the frontend must send as the x-csrf-token header on mutating requests */
app.get('/csrf-token', (req, res) => {
  // Persist the session so the session cookie is sent with this response and
  // reused on subsequent requests. Without this, each stateless request gets a
  // new sessionID, which would invalidate the CSRF token on the next call.
  req.session.csrfInit = true;
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: 'Session error' });
    }
    res.json({ csrfToken: generateCsrfToken(req, res) });
  });
});

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

/** Logout: revoke tokens and destroy the session (CSRF-protected) */
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
