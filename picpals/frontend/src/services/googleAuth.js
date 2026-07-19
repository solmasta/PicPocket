import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

/**
 * Exchange a Google OAuth access token for a PicPals session token.
 * Returns the user profile object including a `token` field.
 */
export async function loginWithGoogle(accessToken) {
  const response = await axios.post(API_BASE + '/api/auth/google', { accessToken });
  return response.data;
}

/**
 * Refresh the current session token.
 */
export async function refreshToken(token) {
  const response = await axios.post(
    API_BASE + '/api/auth/refresh',
    {},
    { headers: { Authorization: 'Bearer ' + token } }
  );
  return response.data.token;
}

/**
 * Log out the current user by invalidating the server-side session.
 */
export async function logout(token) {
  await axios.post(
    API_BASE + '/api/auth/logout',
    {},
    { headers: { Authorization: 'Bearer ' + token } }
  );
}
