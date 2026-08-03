// Dropbox is an optional storage connection, independent of how someone
// signs in to the app (local identity or Google). Nothing in the app should
// assume it's configured. Read process.env fresh on every call (rather than
// caching a module-level constant) so tests can set/unset
// REACT_APP_DROPBOX_CLIENT_ID per-case.

export function getDropboxClientId() {
  return process.env.REACT_APP_DROPBOX_CLIENT_ID || '';
}

export function isDropboxConfigured() {
  return Boolean(getDropboxClientId());
}
