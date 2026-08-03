import { openOAuthPopup } from '../utils/oauthPopup';

// The "consumers" tenant covers personal Microsoft accounts (outlook.com,
// hotmail.com, live.com, plus any Microsoft account) — what a family member
// signing in with their own Microsoft account would have. Files.ReadWrite.AppFolder
// scopes access to a single hidden app-specific folder rather than the
// person's whole OneDrive.
const AUTHORIZE_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize';
const SCOPES = 'Files.ReadWrite.AppFolder User.Read offline_access';
const GRAPH_API = 'https://graph.microsoft.com/v1.0';

/**
 * Open a Microsoft sign-in popup and resolve with an access token for the
 * app's OneDrive folder + basic profile info.
 */
export async function connectOneDrive(clientId) {
  const redirectUri = window.location.origin + '/';
  const authUrl =
    `${AUTHORIZE_URL}?client_id=${encodeURIComponent(clientId)}` +
    `&response_type=token` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&response_mode=fragment`;

  const params = await openOAuthPopup(authUrl, { redirectUri });
  if (!params.access_token) {
    throw new Error('OneDrive sign-in did not return an access token.');
  }

  const account = await getOneDriveAccount(params.access_token);

  return {
    accessToken: params.access_token,
    expiresAt: Date.now() + Number(params.expires_in || 3600) * 1000,
    accountName: account.displayName || account.userPrincipalName || 'OneDrive account',
    accountEmail: account.mail || account.userPrincipalName || null,
  };
}

async function getOneDriveAccount(accessToken) {
  const res = await fetch(`${GRAPH_API}/me`, {
    headers: { Authorization: 'Bearer ' + accessToken },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch OneDrive account info');
  }
  return res.json();
}
