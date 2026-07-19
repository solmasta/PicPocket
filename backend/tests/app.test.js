'use strict';

process.env.TOKEN_ENCRYPTION_KEY = 'c'.repeat(64);
process.env.SESSION_SECRET = 'test-session-secret';
process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3001/auth/google/callback';

const request = require('supertest');
const app = require('../src/app');

/**
 * Helper: fetches a CSRF token from the app, returning both the token value
 * and the Set-Cookie header so subsequent requests can send the CSRF cookie.
 */
async function fetchCsrfToken(agent) {
  const res = await agent.get('/csrf-token');
  expect(res.status).toBe(200);
  return res.body.csrfToken;
}

describe('GET /health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /auth/me', () => {
  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authenticated');
  });
});

describe('GET /auth/google', () => {
  test('redirects to Google consent screen', async () => {
    const res = await request(app).get('/auth/google').redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('accounts.google.com');
  });
});

describe('GET /auth/google/callback', () => {
  test('returns 400 when code is missing', async () => {
    const res = await request(app).get('/auth/google/callback');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing authorization code');
  });

  test('returns 400 when OAuth error is returned', async () => {
    const res = await request(app).get('/auth/google/callback?error=access_denied');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('access_denied');
  });
});

describe('GET /csrf-token', () => {
  test('returns a CSRF token', async () => {
    const res = await request(app).get('/csrf-token');
    expect(res.status).toBe(200);
    expect(typeof res.body.csrfToken).toBe('string');
    expect(res.body.csrfToken.length).toBeGreaterThan(0);
  });
});

describe('POST /auth/logout', () => {
  test('returns 403 without a CSRF token', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(403);
  });

  test('responds 200 with a valid CSRF token', async () => {
    const agent = request.agent(app);
    const csrfToken = await fetchCsrfToken(agent);
    const res = await agent
      .post('/auth/logout')
      .set('x-csrf-token', csrfToken);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out');
  });
});

