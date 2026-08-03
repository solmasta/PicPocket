import { useState, useEffect, useCallback } from 'react';
import { listDriveFiles, downloadDriveFile } from '../../services/googleDriveService';
import { listGooglePhotos, downloadGooglePhotoBytes } from '../../services/googlePhotosService';
import { listOneDriveFiles, downloadOneDriveFile } from '../../services/oneDriveStorageService';
import { listDropboxFiles, downloadDropboxFile } from '../../services/dropboxStorageService';
import './StorageLedger.css';

// Safety cap on how many Google Photos pages to walk when reconciling, so a
// very large library can't turn "Check Cloud Storage" into an unbounded
// fetch loop.
const MAX_GOOGLE_PHOTOS_PAGES = 20;

async function fetchAllGooglePhotos(accessToken) {
  let items = [];
  let pageToken;
  let pages = 0;
  do {
    const result = await listGooglePhotos(accessToken, pageToken);
    items = items.concat(result.items || []);
    pageToken = result.nextPageToken;
    pages += 1;
  } while (pageToken && pages < MAX_GOOGLE_PHOTOS_PAGES);
  return items;
}

// Each provider knows how to check availability, list its backup
// folder/album, and download an item's bytes for import — everything else
// (the table, the orphan list, the import buttons) is generic over this.
// `cloudBackup` field names match what PhotoUpload already writes when it
// backs a photo up, so reconciliation lines up with existing records.
const PROVIDERS = [
  {
    key: 'googleDrive',
    label: 'Google Drive',
    icon: '☁️',
    isAvailable: (ctx) => ctx.hasDriveAccess,
    list: async (ctx) => {
      const files = await listDriveFiles(ctx.user.accessToken);
      return files.map((f) => ({ id: f.id, name: f.name, createdTime: f.createdTime, link: f.webViewLink, raw: f }));
    },
    download: async (ctx, item) => {
      const blob = await downloadDriveFile(ctx.user.accessToken, item.id);
      return new File([blob], item.name, { type: item.raw.mimeType || blob.type || 'image/jpeg' });
    },
    unavailableHint: 'Sign in with Google and grant Drive access in Settings',
  },
  {
    key: 'googlePhotos',
    label: 'Google Photos',
    icon: '🖼️',
    isAvailable: (ctx) => ctx.hasPhotosAccess,
    list: async (ctx) => {
      const items = await fetchAllGooglePhotos(ctx.user.accessToken);
      return items.map((p) => ({ id: p.id, name: p.filename || `${p.id}.jpg`, createdTime: null, link: p.productUrl, raw: p }));
    },
    download: async (ctx, item) => {
      const blob = await downloadGooglePhotoBytes(item.raw);
      return new File([blob], item.name, { type: item.raw.mimeType || blob.type || 'image/jpeg' });
    },
    unavailableHint: 'Sign in with Google and grant Photos access in Settings',
  },
  {
    key: 'oneDrive',
    label: 'OneDrive',
    icon: '🟦',
    isAvailable: (ctx) => Boolean(ctx.oneDriveConnection?.accessToken),
    list: async (ctx) => {
      const files = await listOneDriveFiles(ctx.oneDriveConnection.accessToken);
      return files.map((f) => ({ id: f.id, name: f.name, createdTime: f.createdDateTime, link: f.webUrl, raw: f }));
    },
    download: async (ctx, item) => {
      const blob = await downloadOneDriveFile(ctx.oneDriveConnection.accessToken, item.id);
      return new File([blob], item.name, { type: item.raw.file?.mimeType || blob.type || 'image/jpeg' });
    },
    unavailableHint: 'Connect OneDrive in Settings',
  },
  {
    key: 'dropbox',
    label: 'Dropbox',
    icon: '🔵',
    isAvailable: (ctx) => Boolean(ctx.dropboxConnection?.accessToken),
    list: async (ctx) => {
      const files = await listDropboxFiles(ctx.dropboxConnection.accessToken);
      return files.map((f) => ({ id: f.id, name: f.name, createdTime: f.client_modified, link: null, raw: f }));
    },
    download: async (ctx, item) => {
      const blob = await downloadDropboxFile(ctx.dropboxConnection.accessToken, item.raw.path_lower);
      return new File([blob], item.name, { type: blob.type || 'image/jpeg' });
    },
    unavailableHint: 'Connect Dropbox in Settings',
  },
];

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function StatusPill({ status }) {
  if (status === 'ok') return <span className="ledger-status ledger-status--ok">✔ Backed up</span>;
  if (status === 'missing') return <span className="ledger-status ledger-status--missing">⚠ Missing remotely</span>;
  if (status === 'unchecked') return <span className="ledger-status ledger-status--unchecked">Marked backed up</span>;
  return <span className="ledger-status ledger-status--none">— Not backed up</span>;
}

export default function StorageLedger({ photos, user, onImport, onImportBackupTag, storageConnections }) {
  const oneDriveConnection = storageConnections?.connections?.onedrive || null;
  const dropboxConnection = storageConnections?.connections?.dropbox || null;

  const scope = user?.scope || '';
  const ctx = {
    user,
    oneDriveConnection,
    dropboxConnection,
    hasDriveAccess: Boolean(user?.accessToken) && scope.includes('drive.file'),
    hasPhotosAccess: Boolean(user?.accessToken) && scope.includes('photoslibrary'),
  };
  const availableProviders = PROVIDERS.filter((p) => p.isAvailable(ctx));
  const unavailableProviders = PROVIDERS.filter((p) => !p.isAvailable(ctx));
  const canReconcile = availableProviders.length > 0;

  // { [providerKey]: null (not checked) | [] | [...items] }
  const [remoteByProvider, setRemoteByProvider] = useState({});
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const [storageEstimate, setStorageEstimate] = useState(null);
  const [importingKeys, setImportingKeys] = useState(() => new Set());
  const [importedKeys, setImportedKeys] = useState(() => new Set());
  const [importErrors, setImportErrors] = useState({});
  const [importingAll, setImportingAll] = useState(false);

  const refreshStorageEstimate = useCallback(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then(setStorageEstimate).catch(() => {});
    }
  }, []);

  useEffect(() => {
    refreshStorageEstimate();
  }, [refreshStorageEstimate]);

  const checkCloudStorage = async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const results = await Promise.all(
        availableProviders.map(async (p) => [p.key, await p.list(ctx)])
      );
      setRemoteByProvider((prev) => ({ ...prev, ...Object.fromEntries(results) }));
      setLastChecked(new Date());
      // A fresh check re-derives orphans from scratch, so drop stale markers.
      setImportedKeys(new Set());
      setImportErrors({});
    } catch (err) {
      setCheckError(err.message || 'Failed to check cloud storage.');
    } finally {
      setChecking(false);
    }
  };

  const idKey = (providerKey, id) => `${providerKey}:${id}`;

  const rows = photos.map((photo) => {
    const statuses = PROVIDERS.map((p) => {
      const remoteId = photo.cloudBackup?.[p.key];
      const remoteItems = remoteByProvider[p.key];
      const remoteIds = new Set((remoteItems || []).map((item) => item.id));
      const status = !remoteId ? 'none' : remoteItems === undefined || remoteItems === null ? 'unchecked' : remoteIds.has(remoteId) ? 'ok' : 'missing';
      return { provider: p, status };
    });
    return { photo, statuses };
  });

  const orphansByProvider = PROVIDERS.map((p) => {
    const localIds = new Set(photos.map((photo) => photo.cloudBackup?.[p.key]).filter(Boolean));
    const items = (remoteByProvider[p.key] || []).filter(
      (item) => !localIds.has(item.id) && !importedKeys.has(idKey(p.key, item.id))
    );
    return { provider: p, items };
  }).filter(({ items }) => items.length > 0);

  const totalLocal = photos.length;
  const backedUpNowhere = photos.filter((p) => !PROVIDERS.some((provider) => p.cloudBackup?.[provider.key])).length;
  const totalOrphaned = orphansByProvider.reduce((sum, g) => sum + g.items.length, 0);

  const markImporting = (key, isImporting) => {
    setImportingKeys((prev) => {
      const next = new Set(prev);
      if (isImporting) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const importItem = async (provider, item) => {
    const key = idKey(provider.key, item.id);
    markImporting(key, true);
    setImportErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    try {
      const file = await provider.download(ctx, item);
      const photo = await onImport(file, { tags: [] });
      if (photo) {
        await onImportBackupTag({ ...photo, cloudBackup: { ...photo.cloudBackup, [provider.key]: item.id } });
      }
      setImportedKeys((prev) => new Set(prev).add(key));
      refreshStorageEstimate();
    } catch (err) {
      setImportErrors((prev) => ({ ...prev, [key]: err.message || 'Import failed.' }));
    } finally {
      markImporting(key, false);
    }
  };

  const importAll = async () => {
    setImportingAll(true);
    // Sequential on purpose: each import writes a full-size photo into
    // IndexedDB, and running every provider's downloads at once would both
    // hammer API rate limits and make per-item progress unreadable.
    for (const { provider, items } of orphansByProvider) {
      for (const item of items) {
        await importItem(provider, item);
      }
    }
    setImportingAll(false);
  };

  const usagePct = storageEstimate?.quota
    ? Math.min(100, Math.round((storageEstimate.usage / storageEstimate.quota) * 100))
    : null;

  return (
    <div className="storage-ledger">
      <h1 className="storage-ledger__title">🗄️ Storage Ledger</h1>
      <p className="storage-ledger__intro">
        This device's local library is the one place with the most room to keep everything —
        Google Drive, Google Photos, OneDrive, and Dropbox backups are useful, but they're
        scattered across whichever device made them. Bring backups from other
        devices/sessions in here, and check how much room is left to do it.
      </p>

      {/* Local storage space available for consolidating everything here */}
      {storageEstimate && (
        <div className="ledger-section ledger-quota">
          <div className="ledger-quota__row">
            <span className="ledger-quota__label">💾 This device's local storage</span>
            <span className="ledger-quota__figures">
              {formatBytes(storageEstimate.usage)} used
              {storageEstimate.quota ? ` of ${formatBytes(storageEstimate.quota)} available` : ''}
            </span>
          </div>
          {usagePct !== null && (
            <div className="ledger-quota__bar">
              <div className="ledger-quota__fill" style={{ width: `${usagePct}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Overview */}
      <div className="ledger-stats">
        <div className="ledger-stat">
          <span className="ledger-stat__value">{totalLocal}</span>
          <span className="ledger-stat__label">On this device</span>
        </div>
        {PROVIDERS.map((p) => (
          <div className="ledger-stat" key={p.key}>
            <span className="ledger-stat__value">
              {photos.filter((photo) => photo.cloudBackup?.[p.key]).length}
            </span>
            <span className="ledger-stat__label">{p.icon} Marked backed up to {p.label}</span>
          </div>
        ))}
        <div className="ledger-stat ledger-stat--warn">
          <span className="ledger-stat__value">{backedUpNowhere}</span>
          <span className="ledger-stat__label">Not backed up anywhere</span>
        </div>
      </div>

      {/* Reconcile control */}
      <div className="ledger-section">
        <div className="ledger-section__header">
          <div>
            <h2 className="ledger-section__title">Check Cloud Storage</h2>
            <p className="ledger-section__desc">
              {canReconcile
                ? `Fetch what's actually in ${availableProviders.map((p) => p.label).join(', ')} right now, and compare it against this device's records.`
                : 'Sign in with Google, or connect OneDrive/Dropbox in Settings, to reconcile against your cloud storage — until then, only the local counts above are available.'}
            </p>
            {canReconcile && unavailableProviders.length > 0 && (
              <p className="ledger-section__desc ledger-section__desc--muted">
                Not included yet: {unavailableProviders.map((p) => `${p.label} (${p.unavailableHint})`).join('; ')}.
              </p>
            )}
          </div>
          <button
            className="ledger-btn"
            onClick={checkCloudStorage}
            disabled={!canReconcile || checking}
          >
            {checking ? 'Checking…' : 'Check Cloud Storage'}
          </button>
        </div>
        {lastChecked && (
          <p className="ledger-last-checked">Last checked {lastChecked.toLocaleTimeString()}</p>
        )}
        {checkError && <p className="ledger-error">⚠️ {checkError}</p>}
      </div>

      {/* Per-photo ledger */}
      <div className="ledger-section">
        <h2 className="ledger-section__title">Per-Photo Status</h2>
        {rows.length === 0 ? (
          <p className="ledger-empty">No photos on this device yet.</p>
        ) : (
          <div className="ledger-table-wrap">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  {PROVIDERS.map((p) => (
                    <th key={p.key}>{p.icon} {p.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ photo, statuses }) => (
                  <tr key={photo.id}>
                    <td className="ledger-photo-cell">
                      <img
                        src={photo.thumbnail || photo.dataUrl}
                        alt={photo.fileName}
                        className="ledger-thumb"
                      />
                      <span className="ledger-filename" title={photo.fileName}>
                        {photo.fileName}
                      </span>
                    </td>
                    {statuses.map(({ provider, status }) => (
                      <td key={provider.key}><StatusPill status={status} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Orphaned remote files — bring them into this device's library */}
      {totalOrphaned > 0 && (
        <div className="ledger-section">
          <div className="ledger-section__header">
            <div>
              <h2 className="ledger-section__title">Found in the Cloud, Not on This Device</h2>
              <p className="ledger-section__desc">
                Backed up under a connected account — likely from another device or browser —
                but missing from this device's local library. Add them here so everything
                lives in one place.
              </p>
            </div>
            <button className="ledger-btn" onClick={importAll} disabled={importingAll}>
              {importingAll ? 'Adding all…' : `Add All to This Device (${totalOrphaned})`}
            </button>
          </div>

          {orphansByProvider.map(({ provider, items }) => (
            <div className="ledger-orphan-group" key={provider.key}>
              <h3 className="ledger-orphan-title">{provider.icon} {provider.label} ({items.length})</h3>
              <ul className="ledger-orphan-list">
                {items.map((item) => {
                  const key = idKey(provider.key, item.id);
                  return (
                    <li key={key} className="ledger-orphan-item">
                      <div>
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noreferrer">{item.name}</a>
                        ) : (
                          <span>{item.name}</span>
                        )}
                        {item.createdTime && (
                          <span className="ledger-orphan-date">
                            {' '}· {new Date(item.createdTime).toLocaleDateString()}
                          </span>
                        )}
                        {importErrors[key] && <p className="ledger-error ledger-error--inline">⚠️ {importErrors[key]}</p>}
                      </div>
                      <button
                        className="ledger-btn ledger-btn--sm"
                        onClick={() => importItem(provider, item)}
                        disabled={importingKeys.has(key) || importingAll}
                      >
                        {importingKeys.has(key) ? 'Adding…' : 'Add to This Device'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
