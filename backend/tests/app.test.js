'use strict';

process.env.TOKEN_ENCRYPTION_KEY = 'c'.repeat(64);
process.env.SESSION_SECRET = 'test-session-secret';
process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3001/auth/google/callback';

const request = require('supertest');
const app = require('../src/app');

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

describe('POST /auth/logout', () => {
  test('responds 200 and clears the session', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out');
  });
});
