import { useEffect, useMemo, useState, useCallback } from 'react';
import { getStorageInsights } from '../../services/aiService';
import './AIStorageInsights.css';

const PROVIDER_KEYS = ['googleDrive', 'googlePhotos', 'oneDrive', 'dropbox'];

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Picks which photo in a duplicate group to keep: prefer the one already
// backed up somewhere (so deleting the rest doesn't lose a backup link),
// then fall back to the earliest upload.
function pickKeeper(group) {
  const backedUp = group.filter((p) => PROVIDER_KEYS.some((k) => p.cloudBackup?.[k]));
  const pool = backedUp.length ? backedUp : group;
  return pool.reduce((earliest, p) =>
    new Date(p.uploadDate) < new Date(earliest.uploadDate) ? p : earliest
  );
}

function buildStorageStats(photos) {
  const totalPhotos = photos.length;
  const totalBytes = photos.reduce((sum, p) => sum + (p.fileSize || 0), 0);

  const perProvider = { googleDrive: 0, googlePhotos: 0, oneDrive: 0, dropbox: 0 };
  let backedUpNowhere = 0;
  photos.forEach((p) => {
    const backup = p.cloudBackup || {};
    const hasAny = PROVIDER_KEYS.some((k) => backup[k]);
    if (!hasAny) backedUpNowhere += 1;
    PROVIDER_KEYS.forEach((k) => {
      if (backup[k]) perProvider[k] += 1;
    });
  });

  const byHash = new Map();
  photos.forEach((p) => {
    if (!p.contentHash) return;
    if (!byHash.has(p.contentHash)) byHash.set(p.contentHash, []);
    byHash.get(p.contentHash).push(p);
  });
  const duplicateGroups = [...byHash.values()].filter((group) => group.length > 1);
  const duplicateWastedBytes = duplicateGroups.reduce(
    (sum, group) => sum + (group.length - 1) * (group[0].fileSize || 0),
    0
  );

  const tagCounts = new Map();
  photos.forEach((p) => {
    (p.tags || []).forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));
  });
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  return {
    totalPhotos,
    totalBytes,
    backedUpNowhere,
    perProvider,
    duplicateGroups: duplicateGroups.length,
    duplicateWastedBytes,
    topTags,
    _duplicateGroupList: duplicateGroups,
  };
}

export default function AIStorageInsights({ photos, onDelete }) {
  const stats = useMemo(() => buildStorageStats(photos), [photos]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const { _duplicateGroupList, ...statsForAI } = stats;
      const result = await getStorageInsights(statsForAI);
      setInsights(result);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats]);

  useEffect(() => {
    if (stats.totalPhotos > 0) {
      fetchInsights();
    }
    // Only auto-run once per mount — re-runs are explicit via the refresh
    // button so editing/deleting photos doesn't spam the AI endpoint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanUpGroup = async (group) => {
    const keeper = pickKeeper(group);
    setDeletingKey(keeper.contentHash);
    try {
      for (const photo of group) {
        if (photo.id !== keeper.id) {
          await onDelete(photo.id);
        }
      }
    } finally {
      setDeletingKey(null);
    }
  };

  if (stats.totalPhotos === 0) {
    return null;
  }

  return (
    <div className="ai-insights">
      <div className="ai-insights__header">
        <h2 className="ai-insights__title">🤖 AI Storage Insights</h2>
        <button className="ai-insights-btn" onClick={fetchInsights} disabled={loading}>
          {loading ? 'Thinking…' : 'Refresh'}
        </button>
      </div>

      <div className="ai-insights__summary">
        {loading && !insights ? (
          <p className="ai-insights__loading">Analyzing your library…</p>
        ) : insights ? (
          <>
            <p className="ai-insights__text">{insights.summary}</p>
            {insights.recommendations.length > 0 && (
              <ul className="ai-insights__recommendations">
                {insights.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            )}
            {insights.source !== 'ai' && (
              <p className="ai-insights__source-note">
                Showing a locally-computed summary — AI wasn't reachable.
              </p>
            )}
          </>
        ) : null}
      </div>

      {stats._duplicateGroupList.length > 0 && (
        <div className="ai-insights__duplicates">
          <h3 className="ai-insights__subtitle">
            Duplicate Photos ({stats.duplicateGroups} group{stats.duplicateGroups === 1 ? '' : 's'}, {formatBytes(stats.duplicateWastedBytes)} reclaimable)
          </h3>
          {stats._duplicateGroupList.map((group) => {
            const keeper = pickKeeper(group);
            return (
              <div className="ai-insights__dup-group" key={group[0].contentHash}>
                <div className="ai-insights__dup-thumbs">
                  {group.map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.thumbnail || photo.dataUrl}
                      alt={photo.fileName}
                      className={`ai-insights__dup-thumb ${photo.id === keeper.id ? 'ai-insights__dup-thumb--keep' : ''}`}
                      title={photo.id === keeper.id ? `${photo.fileName} (kept)` : photo.fileName}
                    />
                  ))}
                </div>
                <div className="ai-insights__dup-meta">
                  <span>{group.length} copies of {keeper.fileName}</span>
                  <button
                    className="ai-insights-btn"
                    onClick={() => cleanUpGroup(group)}
                    disabled={deletingKey === group[0].contentHash}
                  >
                    {deletingKey === group[0].contentHash
                      ? 'Cleaning up…'
                      : `Keep 1, Delete ${group.length - 1}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
