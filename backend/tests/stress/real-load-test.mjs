// Real stress test for the PicPocket Worker's actual request-handling code.
//
// The previous "stress test" here (simple-stress-test.js) imported
// node-fetch and read a BASE_URL, but every operation it measured
// (mockAuth/mockFetchPhotos/mockUploadPhoto/mockSearch) was just
// `await delay(N)` returning canned data — it never made a single real
// request. STRESS_TEST_REPORT.md's numbers came from that mock, not from
// exercising this codebase.
//
// This script instead drives handleApi() — the exact function worker.js
// calls per-request in production — directly in Node, with real Request
// objects, against the routes that are actually reachable from the current
// frontend: /api/ai/analyze and /api/ai/storage-insights (unauthenticated,
// stateless — see server.js for why). The legacy D1/R2 photo/album/search
// routes are excluded on purpose: the frontend's photo library is entirely
// local (IndexedDB) since usePhotos.js, nothing in the app sends a session
// token those routes would accept, so load-testing them would be
// benchmarking dead code.
//
// There's no live Cloudflare Workers AI to call from this sandbox, so two
// env.AI conditions are tested and clearly labeled:
//   - "no AI binding" (env.AI undefined) — the real condition for anyone
//     running `wrangler dev` without Cloudflare auth, and exercises the
//     documented fallback paths.
//   - "simulated AI" — a mock env.AI.run with randomized latency/failure,
//     to exercise the Promise.allSettled concurrency handling and the
//     rules-fallback-on-model-failure path under load. This does NOT
//     measure real Workers AI latency; it only measures this codebase's
//     overhead and correctness around a slow/unreliable model call.

import { handleApi } from '../../src/server.js';

const ENV_BASE = { ALLOWED_ORIGINS: 'http://localhost:3000' };

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

function summarize(label, durations, errors, statusCounts) {
  const sorted = [...durations].sort((a, b) => a - b);
  const total = durations.length;
  const avg = total ? durations.reduce((a, b) => a + b, 0) / total : 0;
  console.log(`\n--- ${label} ---`);
  console.log(`  requests: ${total}, errors (thrown): ${errors}`);
  console.log(`  status codes: ${JSON.stringify(statusCounts)}`);
  console.log(`  avg: ${avg.toFixed(1)}ms  p50: ${percentile(sorted, 0.5)}ms  p95: ${percentile(sorted, 0.95)}ms  p99: ${percentile(sorted, 0.99)}ms  max: ${sorted[sorted.length - 1] ?? 0}ms`);
}

async function fireConcurrent(concurrency, total, makeRequest, env) {
  const durations = [];
  const statusCounts = {};
  let errors = 0;
  let inFlight = 0;
  let launched = 0;

  return new Promise((resolve) => {
    function launchNext() {
      if (launched >= total) {
        if (inFlight === 0) resolve({ durations, errors, statusCounts });
        return;
      }
      launched += 1;
      inFlight += 1;
      const start = performance.now();
      handleApi(makeRequest(), env)
        .then((res) => {
          statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
          return res.arrayBuffer(); // fully drain the body, like a real client would
        })
        .catch(() => {
          errors += 1;
        })
        .finally(() => {
          durations.push(performance.now() - start);
          inFlight -= 1;
          launchNext();
        });
      if (inFlight < concurrency) launchNext();
    }
    for (let i = 0; i < Math.min(concurrency, total); i++) launchNext();
  });
}

function makeAnalyzeRequest(sizeBytes) {
  const bytes = new Uint8Array(sizeBytes);
  crypto.getRandomValues(bytes.subarray(0, Math.min(sizeBytes, 65536))); // realistic-ish, cheap
  return () =>
    new Request('http://localhost:8787/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg', Origin: 'http://localhost:3000' },
      body: bytes,
    });
}

function makeInsightsRequest() {
  const body = JSON.stringify({
    totalPhotos: 842,
    totalBytes: 842 * 3_200_000,
    backedUpNowhere: 130,
    perProvider: { googleDrive: 400, googlePhotos: 250, oneDrive: 90, dropbox: 40 },
    duplicateGroups: 12,
    duplicateWastedBytes: 12 * 3_200_000,
    topTags: [
      { tag: 'horse', count: 210 },
      { tag: 'sunset', count: 84 },
      { tag: 'birthday', count: 40 },
    ],
  });
  return () =>
    new Request('http://localhost:8787/api/ai/storage-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
      body,
    });
}

function makeMalformedRequest(kind) {
  if (kind === 'wrong-content-type') {
    return () =>
      new Request('http://localhost:8787/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
  }
  if (kind === 'oversized-image') {
    const bytes = new Uint8Array(13 * 1024 * 1024); // over the 12MB cap
    return () =>
      new Request('http://localhost:8787/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: bytes,
      });
  }
  if (kind === 'bad-json') {
    return () =>
      new Request('http://localhost:8787/api/ai/storage-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      });
  }
  if (kind === 'unknown-route') {
    return () => new Request('http://localhost:8787/api/nonexistent', { method: 'GET' });
  }
  throw new Error(`unknown kind ${kind}`);
}

// Simulated Workers AI: randomized latency + a failure rate, so the
// endpoint's Promise.allSettled fallback logic gets exercised under
// concurrency instead of always taking the instant-503 "no binding" path.
function makeSimulatedAI({ minMs = 150, maxMs = 900, failureRate = 0.1 } = {}) {
  return {
    run: async (model) => {
      await new Promise((r) => setTimeout(r, minMs + Math.random() * (maxMs - minMs)));
      if (Math.random() < failureRate) {
        throw new Error('simulated Workers AI failure');
      }
      if (model.includes('resnet')) {
        return [
          { label: 'horse, equine', score: 0.71 },
          { label: 'pasture', score: 0.22 },
        ];
      }
      if (model.includes('uform') || model.includes('llava')) {
        return { description: 'A horse standing in a green pasture.' };
      }
      // text generation model for storage insights
      return {
        response: JSON.stringify({
          summary: 'Library looks healthy overall.',
          recommendations: ['Back up unsynced photos.', 'Clear duplicate groups.'],
        }),
      };
    },
  };
}

async function main() {
  console.log('PicPocket backend real load test');
  console.log('Driving handleApi() (the exact function worker.js calls) directly — no mocked network layer.\n');

  const memBefore = process.memoryUsage().heapUsed;

  // 1. /api/ai/storage-insights, no AI binding (rules fallback) — the
  // realistic condition for local dev / any deploy without the [ai]
  // binding wired up.
  {
    const env = { ...ENV_BASE };
    const { durations, errors, statusCounts } = await fireConcurrent(50, 500, makeInsightsRequest(), env);
    summarize('storage-insights x500, concurrency=50, no AI binding (rules fallback)', durations, errors, statusCounts);
  }

  // 2. /api/ai/storage-insights, simulated AI (realistic latency + 10% failure)
  {
    const env = { ...ENV_BASE, AI: makeSimulatedAI({ failureRate: 0.1 }) };
    const { durations, errors, statusCounts } = await fireConcurrent(50, 200, makeInsightsRequest(), env);
    summarize('storage-insights x200, concurrency=50, simulated AI (~150-900ms, 10% failure)', durations, errors, statusCounts);
  }

  // 3. /api/ai/analyze, no AI binding — should be a fast, cheap 503 even
  // under load (this is the "AI not configured" guard, checked before any
  // heavy work).
  {
    const env = { ...ENV_BASE };
    const { durations, errors, statusCounts } = await fireConcurrent(50, 300, makeAnalyzeRequest(300_000), env);
    summarize('analyze x300, concurrency=50, no AI binding (should 503 fast)', durations, errors, statusCounts);
  }

  // 4a. /api/ai/analyze, simulated AI, at the size the client actually
  // sends post-fix (resizeImageToBlob caps at ~640px — tens to a couple
  // hundred KB for a JPEG at quality 0.8).
  {
    const env = { ...ENV_BASE, AI: makeSimulatedAI({ failureRate: 0.05 }) };
    const sizes = [25_000, 60_000, 120_000, 200_000];
    let i = 0;
    const cycledRequest = () => makeAnalyzeRequest(sizes[i++ % sizes.length])();
    const { durations, errors, statusCounts } = await fireConcurrent(100, 400, cycledRequest, env);
    summarize('analyze x400, concurrency=100, simulated AI, 25-200KB photos (post-fix client size)', durations, errors, statusCounts);
  }

  // 4b. /api/ai/analyze, a caller that skips the client-side resize and
  // sends full-size originals anyway — this is the scenario that
  // originally exposed the queuing problem. Kept here (at lower
  // concurrency, since this is now the defense-in-depth / worst case, not
  // the expected path) to confirm the lowered MAX_IMAGE_BYTES cap plus
  // fast-rejection keeps it from degrading the whole endpoint.
  {
    const env = { ...ENV_BASE, AI: makeSimulatedAI({ failureRate: 0.05 }) };
    const sizes = [1_500_000, 3_900_000]; // second one is just under the 4MB cap
    let i = 0;
    const cycledRequest = () => makeAnalyzeRequest(sizes[i++ % sizes.length])();
    const { durations, errors, statusCounts } = await fireConcurrent(30, 60, cycledRequest, env);
    summarize('analyze x60, concurrency=30, simulated AI, 1.5-3.9MB photos (client resize skipped)', durations, errors, statusCounts);
  }

  // 5. Malformed/abusive input, mixed concurrently — should never crash the
  // process or hang, and should return the documented 4xx, not 5xx.
  {
    const env = { ...ENV_BASE, AI: makeSimulatedAI() };
    const kinds = ['wrong-content-type', 'oversized-image', 'bad-json', 'unknown-route'];
    const results = { durations: [], errors: 0, statusCounts: {} };
    for (const kind of kinds) {
      const { durations, errors, statusCounts } = await fireConcurrent(30, 100, makeMalformedRequest(kind), env);
      results.durations.push(...durations);
      results.errors += errors;
      for (const [k, v] of Object.entries(statusCounts)) results.statusCounts[k] = (results.statusCounts[k] || 0) + v;
    }
    summarize('malformed input x400 (4 kinds x100), concurrency=30', results.durations, results.errors, results.statusCounts);
  }

  const memAfter = process.memoryUsage().heapUsed;
  console.log(`\nHeap used: ${(memBefore / 1e6).toFixed(1)}MB -> ${(memAfter / 1e6).toFixed(1)}MB (delta ${((memAfter - memBefore) / 1e6).toFixed(1)}MB)`);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Stress test crashed:', err);
  process.exit(1);
});
