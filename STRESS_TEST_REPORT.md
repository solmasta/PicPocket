# PicPocket Stress Test Report

## What changed from the previous report

The previous version of this report was generated from `backend/tests/stress/simple-stress-test.js`. That script imported `node-fetch` and read a `BASE_URL`, but every operation it measured (`mockAuth`, `mockFetchPhotos`, `mockUploadPhoto`, `mockSearch`) was just `await delay(N)` returning canned data — it never made a single real request. The "1,250 requests, 20.8 req/s, 145ms average" numbers in that report came from `setTimeout`, not from this codebase. That script has been removed.

This report is from two real tests, both run against the actual current code:

1. **Backend load test** (`backend/tests/stress/real-load-test.mjs`, `npm run stress-test` in `backend/`) — drives `handleApi()`, the exact function `worker.js` calls per request in production, directly with real `Request` objects and concurrency.
2. **Browser stress test** (`tests/e2e/tests/stress.spec.js`) — drives the actual built frontend in headless Chromium (Playwright) through bulk photo uploads, using the real upload pipeline, IndexedDB, Gallery, and AI Storage Insights.

## Scope

The app's photo library lives entirely in the browser's IndexedDB (`usePhotos.js`) — nothing in the current frontend calls the legacy D1/R2-backed `/api/photos`, `/api/albums`, or `/api/search` routes, or sends a session token those routes would accept. Load-testing them would be benchmarking dead code, so this report focuses on what's actually reachable: the local upload/gallery pipeline, and the unauthenticated `/api/ai/analyze` and `/api/ai/storage-insights` routes.

There's no live Cloudflare Workers AI to call from a sandboxed test environment. The backend test covers two conditions, both labeled: "no AI binding" (the real condition for local dev without Cloudflare auth — exercises the documented rules-fallback path) and "simulated AI" (a mock `env.AI.run` with randomized 150-900ms latency and a failure rate, to exercise the concurrency/fallback handling — this does not measure real Workers AI latency).

## Finding #1 (fixed): O(n²) render cost in the upload preview

The browser stress test uploaded a batch of photos and measured wall-clock time per photo:

| Batch size | Before fix | After fix |
|---|---|---|
| 55 photos | 169ms/photo | 37-46ms/photo |
| 200 photos | 598-610ms/photo | 40ms/photo |
| 500 photos | *(not tested)* | 52ms/photo |

At 200 photos the batch took **2 minutes** before the fix; after, **8 seconds**.

**Root cause**: `PhotoUpload.jsx`'s preview grid called `URL.createObjectURL(file)` inline during render, once per staged file. `handleUpload` calls `setUploadProgress` several times per file across a batch, and each of those re-renders `PhotoUpload`, which re-ran that `.map()` over *every* staged file — creating a new object URL for all N files on every progress tick, roughly N × (progress ticks per file × N) = O(n²) total calls. None of those URLs were ever revoked either, so it was leaking a blob per file per re-render on top of the CPU cost.

Confirmed the AI network call (which fails in this test — no backend running) wasn't the cause by mocking `/api/ai/*` to return instantly via `page.route()`; the timing didn't change, isolating the cost to the render path.

**Fix**: memoize the object URLs in a `useMemo` keyed on `selectedFiles` (created once per file, not once per render), and revoke them on cleanup. See `frontend/src/components/Upload/PhotoUpload.jsx`.

This matters in practice: `analyzePhoto` is now called automatically on every upload (auto-tagging), and the AI Storage Insights panel encourages bulk imports from other cloud drives via "Add All to This Device" — both make larger batch uploads a normal path, not an edge case.

## Backend load test results

Run via `cd backend && npm run stress-test`.

| Scenario | Requests | Concurrency | Status codes | avg | p95 | p99 |
|---|---|---|---|---|---|---|
| `/storage-insights`, no AI binding (rules fallback) | 500 | 50 | 200×500 | 14ms | 23ms | 25ms |
| `/storage-insights`, simulated AI (~150-900ms, 10% failure) | 200 | 50 | 200×200 | 529ms | 862ms | 893ms |
| `/analyze`, no AI binding (should 503 fast) | 300 | 50 | 503×300 | 30ms | 44ms | 45ms |
| `/analyze`, simulated AI, 25-200KB photos (post-fix client size) | 400 | 100 | 200×398, 502×2 | 1.3s | 2.3s | 2.4s |
| `/analyze`, simulated AI, 1.5-3.9MB photos (client resize skipped) | 60 | 30 | 200×60 | 21.7s | 22.1s | 22.1s |
| Malformed input (bad content-type, oversized image, bad JSON, unknown route) mixed | 400 | 30 | 400×200, 404×100, 413×100 | 292ms | 1.7s | 1.8s |

Notes:

- The "no AI binding" cases confirm the documented guard clauses actually work under concurrency: `/analyze` returns 503 fast rather than doing any work, and `/storage-insights` returns the rule-based summary without ever touching `env.AI`.
- The malformed-input run confirms the endpoint returns the documented 4xx codes under concurrent abuse and never a 5xx or a hang: wrong content-type → 400, >4MB image → 413 (see Finding #2), bad JSON → 400, unknown route → 404.
- The gap between "25-200KB" (1.3s avg) and "1.5-3.9MB" (21.7s avg) at lower concurrency is Finding #2 below — the per-request cost of turning image bytes into the array Workers AI expects scales with byte count, so it matters far more with a caller that skips the client-side resize.
- These are single-process Node numbers, not multi-isolate Cloudflare Workers numbers — Workers scales isolates horizontally in a way this harness can't reproduce. The relative comparison (small vs. large images) is still meaningful; the absolute latency numbers are not a production SLA.

## Finding #2 (fixed): large images are expensive to convert for Workers AI

`Array.from(new Uint8Array(buffer))` (converting image bytes to the plain number array Workers AI's `image` input expects) is synchronous CPU work that scales with byte count:

```
300,000 bytes  -> 38.70ms
800,000 bytes  -> 93.87ms
1,500,000 bytes -> 167.51ms
2,000,000 bytes -> 194.20ms
```

`PhotoUpload.jsx` was sending the original uploaded file (up to 20MB) to `/api/ai/analyze`, not the resized version already generated for the local library. **Fix**: `aiService.analyzePhoto` now downsizes to a ~640px JPEG client-side (`resizeImageToBlob`, `frontend/src/utils/imageFilters.js`) before sending — classification/captioning don't need full resolution. The backend's `MAX_IMAGE_BYTES` cap was also lowered from 12MB to 4MB as defense-in-depth against a caller that skips the resize, not as the primary fix.

## What wasn't tested

- Real Cloudflare Workers AI latency/behavior (not reachable from this environment).
- The legacy D1/R2 `/api/photos`, `/api/albums`, `/api/search` routes (unused by the current frontend — see Scope above). `backend/tests/stress/index.js` is a k6 script that targets these; it needs the k6 binary and a running `wrangler dev`, and its own auth step is a no-op, so every request currently gets a 401 before touching D1/R2.
- Multi-tab/multi-user concurrent access to the same browser's IndexedDB (not how the app is used — the library is per-device).
- Photo counts beyond 500 in the browser (500 was the largest tested; per-photo cost was flat across 55/200/500 after the fix, so there's no evidence of a similar scaling problem beyond that, but it wasn't verified further).

## How to re-run these tests

```bash
# Backend (no server needed — drives the handler code directly)
cd backend && npm run stress-test

# Browser (needs a built frontend served somewhere, and Playwright)
cd frontend && npm run build
npx serve -s build -l 4173   # or any static server
cd ../tests/e2e && npm install
BASE_URL=http://localhost:4173 STRESS_IMAGE_DIR=/path/to/a/folder/of/pngs npx playwright test tests/stress.spec.js
```
