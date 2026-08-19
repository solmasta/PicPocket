import { json } from '../utils/response.js';

// Workers AI models used for photo understanding and storage insights.
// Picked for being small/fast enough to run inline on an upload without a
// noticeable delay, while still giving real (non-heuristic) results.
const CLASSIFICATION_MODEL = '@cf/microsoft/resnet-50';
const CAPTION_MODEL = '@cf/unum/uform-gen2-qwen-500m';
const INSIGHTS_MODEL = '@cf/meta/llama-3.1-8b-instruct';

// Comfortably above what a resized/thumbnailed PicPocket photo needs, but
// still small enough to keep a single Workers AI call fast.
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MIN_CONFIDENCE = 0.15;
const MAX_TAGS = 6;

// ResNet-50 labels look like "Shetland sheepdog, Shetland sheep dog,
// Shetland" — take the first synonym and turn it into a tag that matches
// the lowercase, hyphenated style the rest of the app already uses.
function slugifyLabel(label) {
  return label
    .toLowerCase()
    .split(',')[0]
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * POST /api/ai/analyze
 * Body: raw image bytes (Content-Type: image/*).
 * Runs image classification (-> tags) and captioning against Cloudflare
 * Workers AI and returns whatever succeeded — the two calls are independent
 * so a captioning hiccup doesn't lose the tags, and vice versa.
 */
export async function handleAnalyzePhoto(request) {
  const { env } = request;

  if (!env.AI) {
    return json({ error: 'AI is not configured for this environment' }, 503);
  }

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.startsWith('image/')) {
    return json({ error: 'Expected an image request body' }, 400);
  }

  let buffer;
  try {
    buffer = await request.arrayBuffer();
  } catch (err) {
    return json({ error: 'Could not read image body' }, 400);
  }

  if (!buffer.byteLength) {
    return json({ error: 'Empty image body' }, 400);
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return json({ error: 'Image too large for AI analysis' }, 413);
  }

  const image = Array.from(new Uint8Array(buffer));

  const [classificationResult, captionResult] = await Promise.allSettled([
    env.AI.run(CLASSIFICATION_MODEL, { image }),
    env.AI.run(CAPTION_MODEL, {
      image,
      prompt: 'Describe this photo in one short, natural sentence.',
      max_tokens: 64,
    }),
  ]);

  let tags = [];
  if (classificationResult.status === 'fulfilled') {
    const predictions = Array.isArray(classificationResult.value) ? classificationResult.value : [];
    tags = predictions
      .filter((p) => typeof p?.score === 'number' && p.score >= MIN_CONFIDENCE)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_TAGS)
      .map((p) => slugifyLabel(p.label || ''))
      .filter(Boolean);
  } else {
    console.error('AI classification failed:', classificationResult.reason);
  }

  let caption = '';
  if (captionResult.status === 'fulfilled') {
    caption = String(captionResult.value?.description || '').trim();
  } else {
    console.error('AI captioning failed:', captionResult.reason);
  }

  if (!tags.length && !caption) {
    return json({ error: 'AI analysis failed' }, 502);
  }

  return json({ tags, caption });
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return 'an unknown amount';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const PROVIDER_LABELS = {
  googleDrive: 'Google Drive',
  googlePhotos: 'Google Photos',
  oneDrive: 'OneDrive',
  dropbox: 'Dropbox',
};

// Deterministic, non-AI summary built straight from the stats — used both
// as the response when Workers AI isn't configured (e.g. local dev) and as
// a safety net if the model call fails or returns something unusable.
function buildFallbackInsights(stats) {
  const {
    totalPhotos = 0,
    totalBytes = 0,
    backedUpNowhere = 0,
    perProvider = {},
    duplicateGroups = 0,
    duplicateWastedBytes = 0,
  } = stats || {};

  const recommendations = [];

  if (duplicateGroups > 0) {
    recommendations.push(
      `Clear out ${duplicateGroups} duplicate group${duplicateGroups === 1 ? '' : 's'} to reclaim ${formatBytes(duplicateWastedBytes)}.`
    );
  }
  if (backedUpNowhere > 0) {
    recommendations.push(
      `Back up ${backedUpNowhere} photo${backedUpNowhere === 1 ? '' : 's'} that ${backedUpNowhere === 1 ? "isn't" : "aren't"} saved to any cloud drive yet.`
    );
  }
  const connectedProviders = Object.entries(perProvider).filter(([, count]) => count > 0);
  if (connectedProviders.length === 0 && totalPhotos > 0) {
    recommendations.push('Connect a cloud drive (Google Drive, Google Photos, OneDrive, or Dropbox) so this library has an off-device backup.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Your library looks well backed up — no action needed right now.');
  }

  const summary =
    totalPhotos === 0
      ? "You haven't uploaded any photos yet."
      : `This device holds ${totalPhotos} photo${totalPhotos === 1 ? '' : 's'} (${formatBytes(totalBytes)}), with ${backedUpNowhere} not backed up anywhere and ${duplicateGroups} duplicate group${duplicateGroups === 1 ? '' : 's'} taking up extra space.`;

  return { summary, recommendations: recommendations.slice(0, 4) };
}

function buildPrompt(stats) {
  const {
    totalPhotos = 0,
    totalBytes = 0,
    backedUpNowhere = 0,
    perProvider = {},
    duplicateGroups = 0,
    duplicateWastedBytes = 0,
    topTags = [],
  } = stats || {};

  const providerLines = Object.entries(perProvider)
    .map(([key, count]) => `- ${PROVIDER_LABELS[key] || key}: ${count} photo(s)`)
    .join('\n');

  const tagLines = topTags.length
    ? topTags.map((t) => `${t.tag} (${t.count})`).join(', ')
    : 'none';

  return `Library stats:
- Total photos on this device: ${totalPhotos}
- Total local storage used: ${formatBytes(totalBytes)}
- Photos not backed up to any cloud drive: ${backedUpNowhere}
- Duplicate groups found: ${duplicateGroups}, wasting ${formatBytes(duplicateWastedBytes)}
- Backup coverage by provider:
${providerLines || '- none connected'}
- Most common tags: ${tagLines}

Write a short, friendly storage summary and up to 4 recommendations based only on these numbers.`;
}

function parseInsightsResponse(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.recommendations)) {
      return null;
    }
    return {
      summary: parsed.summary.trim(),
      recommendations: parsed.recommendations
        .filter((r) => typeof r === 'string' && r.trim())
        .map((r) => r.trim())
        .slice(0, 6),
    };
  } catch {
    return null;
  }
}

/**
 * POST /api/ai/storage-insights
 * Body: precomputed library stats (see buildPrompt above) — the client
 * owns the photo library (IndexedDB), so it computes the real numbers and
 * this endpoint only turns them into a readable summary. The model is
 * instructed to work only from the numbers it's given so it can't invent
 * counts; a rule-based fallback covers local dev (no AI binding) and any
 * model failure.
 */
export async function handleStorageInsights(request) {
  const { env } = request;

  let stats;
  try {
    stats = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const fallback = buildFallbackInsights(stats);

  if (!env.AI) {
    return json({ ...fallback, source: 'rules' });
  }

  try {
    const result = await env.AI.run(INSIGHTS_MODEL, {
      messages: [
        {
          role: 'system',
          content:
            'You are a concise storage assistant inside a photo app called PicPocket. ' +
            'You are given exact, precomputed statistics about the user\'s photo library and cloud backup coverage. ' +
            'Never invent numbers beyond the ones given. Respond with strict JSON only, no prose outside it, ' +
            'in the shape {"summary": string, "recommendations": string[]}. ' +
            'Keep the summary to 1-2 sentences and give at most 4 short, actionable recommendations.',
        },
        { role: 'user', content: buildPrompt(stats) },
      ],
    });

    const parsed = parseInsightsResponse(result?.response);
    if (parsed) {
      return json({ ...parsed, source: 'ai' });
    }
    return json({ ...fallback, source: 'rules' });
  } catch (err) {
    console.error('AI storage insights failed:', err);
    return json({ ...fallback, source: 'rules' });
  }
}
