// Google sign-in is optional. PicPals' core photo storage runs entirely on
// IndexedDB in the browser, so the app must work with no Client ID at all.
// Read process.env fresh on every call (rather than caching a module-level
// constant) so tests can set/unset REACT_APP_GOOGLE_CLIENT_ID per-case.

export function getGoogleClientId() {
  return process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
}

export function isGoogleAuthConfigured() {
  return Boolean(getGoogleClientId());
}
