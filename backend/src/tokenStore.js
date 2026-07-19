'use strict';

const { encrypt, decrypt } = require('./crypto');

/**
 * In-memory secure token store: userId -> encrypted token blob.
 *
 * In production, replace the backing Map with a persistent database
 * (e.g. PostgreSQL, Redis) so tokens survive server restarts.
 */
const _store = new Map();

/**
 * Saves (or replaces) OAuth2 tokens for the given user.
 * Tokens are encrypted with AES-256-GCM before storage.
 *
 * @param {string} userId
 * @param {{ access_token: string, refresh_token?: string, expiry_date?: number, token_type?: string, scope?: string }} tokens
 */
function saveTokens(userId, tokens) {
  if (!userId) throw new Error('userId is required');
  const plaintext = JSON.stringify(tokens);
  _store.set(userId, encrypt(plaintext));
}

/**
 * Retrieves and decrypts OAuth2 tokens for the given user.
 * Returns null when no tokens are stored for that user.
 *
 * @param {string} userId
 * @returns {{ access_token: string, refresh_token?: string, expiry_date?: number } | null}
 */
function getTokens(userId) {
  if (!userId) throw new Error('userId is required');
  const encrypted = _store.get(userId);
  if (!encrypted) return null;
  return JSON.parse(decrypt(encrypted));
}

/**
 * Removes tokens for the given user (e.g. on logout or revocation).
 *
 * @param {string} userId
 */
function deleteTokens(userId) {
  _store.delete(userId);
}

/**
 * Returns true if the store currently holds tokens for the given user.
 *
 * @param {string} userId
 * @returns {boolean}
 */
function hasTokens(userId) {
  return _store.has(userId);
}

module.exports = { saveTokens, getTokens, deleteTokens, hasTokens };
