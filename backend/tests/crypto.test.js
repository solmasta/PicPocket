'use strict';

// Set a valid 64-char hex encryption key before requiring crypto module
process.env.TOKEN_ENCRYPTION_KEY = 'a'.repeat(64);

const { encrypt, decrypt } = require('../src/crypto');

describe('crypto', () => {
  test('encrypts and decrypts a string round-trip', () => {
    const plaintext = 'hello world';
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  test('encrypt produces a different ciphertext each call (random IV)', () => {
    const plaintext = 'same input';
    const enc1 = encrypt(plaintext);
    const enc2 = encrypt(plaintext);
    expect(enc1).not.toBe(enc2);
    // Both should decrypt to the same value
    expect(decrypt(enc1)).toBe(plaintext);
    expect(decrypt(enc2)).toBe(plaintext);
  });

  test('encrypted output has three colon-separated segments', () => {
    const parts = encrypt('test').split(':');
    expect(parts).toHaveLength(3);
    // iv (12 bytes = 24 hex chars), authTag (16 bytes = 32 hex chars), ciphertext
    expect(parts[0]).toHaveLength(24);
    expect(parts[1]).toHaveLength(32);
  });

  test('throws when TOKEN_ENCRYPTION_KEY is missing', () => {
    const original = process.env.TOKEN_ENCRYPTION_KEY;
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(() => encrypt('test')).toThrow('TOKEN_ENCRYPTION_KEY');
    process.env.TOKEN_ENCRYPTION_KEY = original;
  });

  test('throws when TOKEN_ENCRYPTION_KEY is wrong length', () => {
    const original = process.env.TOKEN_ENCRYPTION_KEY;
    process.env.TOKEN_ENCRYPTION_KEY = 'tooshort';
    expect(() => encrypt('test')).toThrow('TOKEN_ENCRYPTION_KEY');
    process.env.TOKEN_ENCRYPTION_KEY = original;
  });

  test('throws on tampered ciphertext (auth tag mismatch)', () => {
    const encrypted = encrypt('original');
    const parts = encrypted.split(':');
    // Flip one nibble in the ciphertext
    parts[2] = (parseInt(parts[2][0], 16) ^ 1).toString(16) + parts[2].slice(1);
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  test('throws on invalid format', () => {
    expect(() => decrypt('invalid')).toThrow('Invalid encrypted data format');
  });
});
