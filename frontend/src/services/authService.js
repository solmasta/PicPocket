import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Surfaces the backend's own {error} message (e.g. "Google OAuth is not
// configured on the server") instead of axios's generic "Request failed
// with status code 500", so a misconfigured deployment fails loudly.
function unwrap(promise) {
  return promise.catch((err) => {
    throw new Error(err.response?.data?.error || err.message);
  });
}

// Exchanges the one-time authorization code from Google sign-in for an
// access token + refresh token, via the backend (the client secret this
// requires must never live in the frontend).
export async function exchangeGoogleCode(code) {
  const response = await unwrap(api.post('/auth/google/token', { code }));
  return response.data;
}

// Exchanges a stored refresh token for a fresh access token, so the app can
// renew a session silently instead of prompting the user to sign in again.
export async function refreshGoogleAccessToken(refreshToken) {
  const response = await unwrap(api.post('/auth/google/refresh', { refreshToken }));
  return response.data;
}
