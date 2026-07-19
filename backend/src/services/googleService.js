const { OAuth2Client } = require('google-auth-library');
const config = require('../config/config');

const client = new OAuth2Client(config.google.clientId);

/**
 * Verify a Google ID token and return the user payload
 */
async function verifyGoogleToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.google.clientId,
  });
  return ticket.getPayload();
}

module.exports = { verifyGoogleToken };
