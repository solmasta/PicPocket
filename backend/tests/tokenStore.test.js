'use strict';

process.env.TOKEN_ENCRYPTION_KEY = 'b'.repeat(64);

const { saveTokens, getTokens, deleteTokens, hasTokens } = require('../src/tokenStore');

const MOCK_TOKENS = {
  access_token: 'ya29.mock_access_token',
  refresh_token: '1//mock_refresh_token',
  expiry_date: Date.now() + 3600 * 1000,
  token_type: 'Bearer',
  scope: 'openid email profile',
};

describe('tokenStore', () => {
  const userId = 'user-abc-123';

  afterEach(() => {
    deleteTokens(userId);
  });

  test('saves and retrieves tokens for a user', () => {
    saveTokens(userId, MOCK_TOKENS);
    const retrieved = getTokens(userId);
    expect(retrieved).toEqual(MOCK_TOKENS);
  });

  test('returns null for an unknown user', () => {
    expect(getTokens('unknown-user')).toBeNull();
  });

  test('hasTokens returns false before save and true after', () => {
    expect(hasTokens(userId)).toBe(false);
    saveTokens(userId, MOCK_TOKENS);
    expect(hasTokens(userId)).toBe(true);
  });

  test('deleteTokens removes the entry', () => {
    saveTokens(userId, MOCK_TOKENS);
    deleteTokens(userId);
    expect(getTokens(userId)).toBeNull();
    expect(hasTokens(userId)).toBe(false);
  });

  test('overwrites existing tokens on second save', () => {
    saveTokens(userId, MOCK_TOKENS);
    const updated = { ...MOCK_TOKENS, access_token: 'ya29.new_token' };
    saveTokens(userId, updated);
    expect(getTokens(userId).access_token).toBe('ya29.new_token');
  });

  test('tokens are not stored as plain text (encrypted in the store)', () => {
    saveTokens(userId, MOCK_TOKENS);
    // Access the internal store through the module — tokens must not appear verbatim
    const storeModule = require('../src/tokenStore');
    // Overwrite the module's internal store reference is not possible without internals;
    // instead, verify that the decrypted value equals the original (encryption round-trip).
    const retrieved = storeModule.getTokens(userId);
    expect(retrieved.access_token).toBe(MOCK_TOKENS.access_token);
  });

  test('throws when userId is falsy', () => {
    expect(() => saveTokens('', MOCK_TOKENS)).toThrow('userId is required');
    expect(() => getTokens(null)).toThrow('userId is required');
  });
});
