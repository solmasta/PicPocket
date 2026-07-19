'use strict';

const { google } = require('googleapis');
const { saveTokens, getTokens, deleteTokens } = require('./tokenStore');

/**
 * Creates and returns a Google OAuth2 client configured from environment variables.
 * Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
 */
function createOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error(
      'Missing required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI'
    );
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

const SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'openid',
  'email',
  'profile',
];

/**
 * Returns the Google OAuth2 authorization URL for the consent screen.
 *
 * @returns {string}
 */
function getAuthUrl() {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline', // request a refresh_token
    scope: SCOPES,
    prompt: 'consent', // always show consent to guarantee refresh_token delivery
  });
}

/**
 * Exchanges an authorization code for tokens, saves them securely, and
 * returns the id_token payload so callers can identify the user.
 *
 * @param {string} code - The authorization code from Google's callback.
 * @returns {{ userId: string, email: string }}
 */
async function exchangeCodeForTokens(code) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Decode the id_token to get the Google user ID and email (no network call needed).
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const userId = payload.sub; // Google's stable user identifier

  saveTokens(userId, tokens);
  return { userId, email: payload.email };
}

/**
 * Returns an authenticated OAuth2 client for the given user.
 * Automatically refreshes the access token when it is expired or about to expire.
 *
 * @param {string} userId
 * @returns {import('googleapis').Auth.OAuth2Client}
 */
async function getAuthenticatedClient(userId) {
  const tokens = getTokens(userId);
  if (!tokens) {
    throw new Error(`No tokens found for user ${userId}. Please re-authenticate.`);
  }

  const client = createOAuthClient();
  client.setCredentials(tokens);

  // Proactively refresh if the access token is expired or expires within 5 minutes.
  const expiresIn = (tokens.expiry_date || 0) - Date.now();
  if (expiresIn < 5 * 60 * 1000) {
    if (!tokens.refresh_token) {
      throw new Error(
        `Access token expired and no refresh_token available for user ${userId}. Please re-authenticate.`
      );
    }
    const { credentials } = await client.refreshAccessToken();
    // Preserve the existing refresh_token if Google omits it in the refresh response.
    const refreshed = {
      ...tokens,
      ...credentials,
      refresh_token: credentials.refresh_token || tokens.refresh_token,
    };
    saveTokens(userId, refreshed);
    client.setCredentials(refreshed);
  }

  return client;
}

/**
 * Revokes all tokens for the given user and removes them from the store.
 *
 * @param {string} userId
 */
async function revokeTokens(userId) {
  const tokens = getTokens(userId);
  if (tokens) {
    try {
      const client = createOAuthClient();
      client.setCredentials(tokens);
      await client.revokeCredentials();
    } catch (_) {
      // Best-effort revocation; always delete local tokens regardless.
    }
    deleteTokens(userId);
  }
}

module.exports = { getAuthUrl, exchangeCodeForTokens, getAuthenticatedClient, revokeTokens };
