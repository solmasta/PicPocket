# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version numbers
across the root, `frontend/`, and `backend/` packages are kept in lockstep.

## [1.1.0] - 2026-07-26

### Fixed
- Album share links (`/album/:token`) only worked in the browser that
  created the album, since album data lives in per-browser IndexedDB with
  no server. Public share links now carry a self-contained snapshot
  (name + photo thumbnails) in the URL fragment, so a recipient's browser
  can render the album without the data already existing locally. Private
  albums omit photo data from the link; same-device viewing still prefers
  the live IndexedDB copy.

### Removed
- `wrangler.toml` and `worker.js` (Cloudflare Worker deployment
  scaffolding). Neither was wired into an actual deployment — no CI step
  ran `wrangler deploy`, no `account_id` was configured, and the frontend
  never called those endpoints — so they were dead code duplicating the
  Express backend's routes and drifting out of sync with it.

## [1.0.0] - baseline

Prior history (photo upload/gallery, filters, collage maker, stories,
slideshow, memory lane, tag search, Google sign-in, Google Drive/Photos
backup, settings) was not tracked with version bumps or changelog entries.
This file starts tracking from 1.1.0 onward; going forward, each release
should add an entry here and bump the version in `package.json`,
`frontend/package.json`, and `backend/package.json` together.
