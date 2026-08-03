# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version numbers
across the root, `frontend/`, and `backend/` packages are kept in lockstep.

## [1.2.5] - 2026-08-03

### Fixed
- A successful Google Drive/Photos backup at upload time was never
  actually saved back to IndexedDB, only mutated on the in-memory photo
  object. The gallery's ☁️ "Backed up" badge could briefly reflect a
  successful backup, but a page reload (or just re-fetching photos)
  showed the photo as not backed up even though the upload to Google
  had genuinely succeeded — `PhotoUpload` now persists the backup
  result via `updatePhoto` so it survives reloads.

### Added
- A separate 🖼️ badge for photos backed up to Google Photos, alongside
  the existing ☁️ Google Drive badge (previously only Drive backup was
  shown at all).

### Note
- This does not change how backup is triggered: photos are still only
  backed up to Google Drive/Photos at upload time, only while signed
  in with the relevant checkbox ticked, and only going forward (photos
  already in the gallery are not retroactively backed up). IndexedDB
  remains the only copy of the photo bytes themselves — there is still
  no "restore from Drive/Photos" flow, so clearing browser storage
  still loses photos regardless of backup status.

## [1.2.4] - 2026-07-31

### Changed
- Signed-in sessions now stay alive until you actually sign out, on
  every deployment (including GitHub Pages, no backend required). A
  little before the ~1hr Google access token is due to expire, the app
  asks Google for a fresh one with no UI at all (`prompt: ''`), which
  succeeds silently as long as the browser still has an active Google
  session — no popup, no click. The "Reconnect" button now only shows
  up if that silent renewal doesn't land within a few seconds (e.g. the
  Google session itself ended, or the browser blocks the request).

## [1.2.3] - 2026-07-31

### Fixed
- Google sign-in was completely broken on the live GitHub Pages
  deployment (`solmasta.github.io`) — "Request failed with status code
  405". The previous release switched sign-in to an OAuth flow that
  exchanges its code for a token via a backend endpoint
  (`POST /api/auth/google/token`), but GitHub Pages is static hosting
  with no way to run that endpoint at all, unlike the Cloudflare Worker
  deployment this was built and tested against. Reverted sign-in back
  to the client-side implicit flow (no backend required), so it works
  on both deployments again. The pull-to-refresh fix and "don't sign
  out just because the access token expired, show Reconnect instead"
  behavior from the same release are kept, since neither depends on a
  backend.
- Net effect: sessions on GitHub Pages go back to needing a manual
  "Reconnect" tap after the ~1hr access token lapses (no silent
  renewal) until this project settles on one deployment target that
  can actually run the token-refresh backend.

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
