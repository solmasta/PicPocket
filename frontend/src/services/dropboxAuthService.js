import { openOAuthPopup } from '../utils/oauthPopup';

const AUTHORIZE_URL = 'https://www.dropbox.com/oauth2/authorize';
const ACCOUNT_API = 'https://api.dropboxapi.com/2/users/get_current_account';

/**
 * Open a Dropbox sign-in popup and resolve with an access token for the
 * app's Dropbox folder + basic profile info.
 */
export async function connectDropbox(clientId) {
  const redirectUri = window.location.origin + '/';
  const authUrl =
    `${AUTHORIZE_URL}?client_id=${encodeURIComponent(clientId)}` +
    `&response_type=token` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  const params = await openOAuthPopup(authUrl, { redirectUri });
  if (!params.access_token) {
    throw new Error('Dropbox sign-in did not return an access token.');
  }

  const account = await getDropboxAccount(params.access_token);

  return {
    accessToken: params.access_token,
    // Dropbox's implicit-flow tokens don't expire on a fixed schedule the
    // way Google/Microsoft's do, but treat it as long-lived-but-not-forever
    // so the UI can eventually prompt a reconnect rather than assume it's
    // valid forever.
    expiresAt: Date.now() + Number(params.expires_in || 4 * 60 * 60) * 1000,
    accountName: account.name?.display_name || 'Dropbox account',
    accountEmail: account.email || null,
  };
}

async function getDropboxAccount(accessToken) {
  const res = await fetch(ACCOUNT_API, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + accessToken },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch Dropbox account info');
  }
  return res.json();
}
