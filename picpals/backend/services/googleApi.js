const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify a Google ID token and return the decoded payload.
 */
async function verifyGoogleToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

/**
 * Exchange an access token for user profile info via Google People API.
 */
async function getGoogleUserInfo(accessToken) {
  const oauth2Client = new OAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const response = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    { headers: { Authorization: 'Bearer ' + accessToken } }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Google user info');
  }
  return response.json();
}

/**
 * List items from the user's Google Photos library.
 */
async function listGooglePhotos(accessToken, pageToken) {
  const url = new URL('https://photoslibrary.googleapis.com/v1/mediaItems');
  url.searchParams.set('pageSize', '50');
  if (pageToken) url.searchParams.set('pageToken', pageToken);

  const response = await fetch(url.toString(), {
    headers: { Authorization: 'Bearer ' + accessToken },
  });

  if (!response.ok) {
    throw new Error('Failed to list Google Photos');
  }
  return response.json();
}

module.exports = { verifyGoogleToken, getGoogleUserInfo, listGooglePhotos };
