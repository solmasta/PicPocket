import api from './api';
import { resizeImageToBlob } from '../utils/imageFilters';

/**
 * AI service — real photo understanding (auto-tagging, captioning) and
 * storage insights, backed by Cloudflare Workers AI via the worker's
 * /api/ai/* routes. Every call degrades gracefully: a network hiccup or an
 * unconfigured AI binding never blocks an upload or breaks the Storage tab,
 * it just falls back to a locally-computed result.
 */

/**
 * Analyze a photo with AI: auto-tag it and generate a short caption in one
 * round trip. Downsizes to a small JPEG client-side first — classification
 * and captioning don't need full resolution, and a stress test showed that
 * sending full-size originals (up to 20MB) makes the server-side
 * bytes-to-array conversion Workers AI requires expensive enough to queue
 * up badly under concurrent uploads. Falls back to the original file if
 * the resize fails (e.g. an unusual format the canvas can't decode).
 * @param {File|Blob} file
 * @returns {Promise<{tags: string[], caption: string}>}
 */
export async function analyzePhoto(file) {
  try {
    const uploadBody = await resizeImageToBlob(file).catch(() => file);
    const response = await api.post('/ai/analyze', uploadBody, {
      headers: { 'Content-Type': uploadBody.type || file.type || 'application/octet-stream' },
      timeout: 30000,
    });
    return {
      tags: Array.isArray(response.data?.tags) ? response.data.tags : [],
      caption: response.data?.caption || '',
    };
  } catch (err) {
    console.warn('AI photo analysis unavailable:', err.message);
    return { tags: [], caption: '' };
  }
}

/**
 * Ask the AI for a natural-language summary and recommendations over
 * precomputed storage-ledger stats (see buildStorageStats in
 * AIStorageInsights). Falls back to a local rule-based summary if the
 * backend/AI is unreachable, so the panel still shows something useful
 * offline.
 * @param {object} stats
 * @returns {Promise<{summary: string, recommendations: string[], source: string}>}
 */
export async function getStorageInsights(stats) {
  try {
    const response = await api.post('/ai/storage-insights', stats, { timeout: 20000 });
    return {
      summary: response.data?.summary || '',
      recommendations: Array.isArray(response.data?.recommendations) ? response.data.recommendations : [],
      source: response.data?.source || 'ai',
    };
  } catch (err) {
    console.warn('AI storage insights unavailable, using local summary:', err.message);
    return { ...buildLocalInsights(stats), source: 'offline' };
  }
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return 'an unknown amount';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Mirrors the backend's rule-based fallback (backend/src/routes/ai.js) so
// the panel degrades the same way whether the AI binding is missing
// server-side or the request never made it to the server at all.
function buildLocalInsights(stats = {}) {
  const {
    totalPhotos = 0,
    totalBytes = 0,
    backedUpNowhere = 0,
    perProvider = {},
    duplicateGroups = 0,
    duplicateWastedBytes = 0,
  } = stats;

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
  const connected = Object.values(perProvider).some((count) => count > 0);
  if (!connected && totalPhotos > 0) {
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
