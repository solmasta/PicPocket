# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version numbers
across the root, `frontend/`, and `backend/` packages are kept in lockstep.

## [1.3.0] - 2026-07-29

### Fixed
- The Horse Profile page kept its data in local component state only, so
  it reset every time you left the page or reloaded. It's now backed by a
  new `profiles` IndexedDB store, loaded on mount and written on Save;
  avatar/gallery uploads are resized to persisted data URLs instead of
  ephemeral blob URLs.
- The splash screen's and main app's background artwork were silently
  failing to load in the production build: both were set via a CSS custom
  property containing `url(...)`, which browsers resolve relative to the
  stylesheet consuming it rather than the page — broken under this app's
  relative asset paths. Fixed by setting `backgroundImage` inline instead.
- Pulling down at the top of a scrollable view triggered the browser's
  native pull-to-refresh, doing a full page reload. Combined with the
  Google session check clearing the saved user as soon as its access
  token expired, this routinely logged people out just from scrolling.
  `overscroll-behavior-y: contain` now disables the browser's own
  pull-to-refresh gesture.

### Changed
- Google sign-in now uses the OAuth authorization-code flow instead of
  the implicit flow: the frontend exchanges its one-time code for an
  access token **and refresh token** via a new backend endpoint
  (`POST /api/auth/google/token`, implemented in both `worker.js` and
  `backend/src/routes/auth.js`). The access token is silently renewed
  ahead of its ~1hr expiry via `POST /api/auth/google/refresh`, so a
  signed-in session now survives indefinitely instead of requiring
  re-login every hour. A "Reconnect" button appears in the header as a
  one-tap fallback for sessions that predate this change (no refresh
  token yet) or whose refresh token Google has since revoked.
  **Requires `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` to be set as
  environment variables on the deployed Worker** — see README.

### Note
- The splash screen's own duplicate "Pic-Pocket" title/tagline text was
  dropped since the hero artwork already carries the branding, and a
  ~1.4s minimum splash duration was added so the artwork is visible even
  when auth resolves instantly.

## [1.1.0] - 2026-07-26

### Fixed
- Album share links (`/album/:token`) only worked in the browser that
  created the album, since album data lives in per-browser IndexedDB with
  no server. Public share links now carry a self-contained snapshot
  (name + photo thumbnails) in the URL fragment, so a recipient's browser
  can render the album without the data already existing locally. Private
  albums omit photo data from the link; same-device viewing still prefers
  the live IndexedDB copy.

### Note
- `wrangler.toml` and `worker.js` were briefly removed under the
  (incorrect) assumption that no live deployment used them. A Cloudflare
  Pages build tied to this repo actually runs `npm run build` followed by
  `npx wrangler deploy`, configured directly in the Cloudflare dashboard —
  invisible from the repo alone — so removing them broke that deploy.
  Both files are restored as-is. Whether to keep the API routes in
  `worker.js` (currently unused by the frontend, duplicated from
  `backend/src/routes/*`) or trim `worker.js` down to asset-only hosting
  is a separate decision, since it now affects a real deployment.

## [1.0.0] - baseline

Prior history (photo upload/gallery, filters, collage maker, stories,
slideshow, memory lane, tag search, Google sign-in, Google Drive/Photos
backup, settings) was not tracked with version bumps or changelog entries.
This file starts tracking from 1.1.0 onward; going forward, each release
should add an entry here and bump the version in `package.json`,
`frontend/package.json`, and `backend/package.json` together.
