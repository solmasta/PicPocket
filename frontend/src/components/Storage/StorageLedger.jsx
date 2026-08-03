import { useState, useEffect, useCallback } from 'react';
import { listDriveFiles, downloadDriveFile } from '../../services/googleDriveService';
import { listGooglePhotos, downloadGooglePhotoBytes } from '../../services/googlePhotosService';
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

export default function StorageLedger({ photos, user, onImport, onImportBackupTag }) {
  const [driveFiles, setDriveFiles] = useState(null); // null = not checked yet this session
  const [photosItems, setPhotosItems] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const [storageEstimate, setStorageEstimate] = useState(null);
  const [importingIds, setImportingIds] = useState(() => new Set());
  const [importedIds, setImportedIds] = useState(() => new Set());
  const [importErrors, setImportErrors] = useState({});
  const [importingAll, setImportingAll] = useState(false);

  const scope = user?.scope || '';
  const hasDriveAccess = Boolean(user?.accessToken) && scope.includes('drive.file');
  const hasPhotosAccess = Boolean(user?.accessToken) && scope.includes('photoslibrary');
  const canReconcile = hasDriveAccess || hasPhotosAccess;

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
      const [drive, photosResult] = await Promise.all([
        hasDriveAccess ? listDriveFiles(user.accessToken) : Promise.resolve([]),
        hasPhotosAccess ? fetchAllGooglePhotos(user.accessToken) : Promise.resolve([]),
      ]);
      setDriveFiles(drive);
      setPhotosItems(photosResult);
      setLastChecked(new Date());
      // Importing earlier may have happened in a previous check; a fresh
      // check re-derives orphans from scratch, so drop stale import markers.
      setImportedIds(new Set());
      setImportErrors({});
    } catch (err) {
      setCheckError(err.message || 'Failed to check cloud storage.');
    } finally {
      setChecking(false);
    }
  };

  const driveIds = new Set((driveFiles || []).map((f) => f.id));
  const photosIds = new Set((photosItems || []).map((p) => p.id));

  const rows = photos.map((photo) => {
    const driveId = photo.cloudBackup?.googleDrive;
    const photosId = photo.cloudBackup?.googlePhotos;
    const driveStatus = !driveId ? 'none' : driveFiles === null ? 'unchecked' : driveIds.has(driveId) ? 'ok' : 'missing';
    const photosStatus = !photosId ? 'none' : photosItems === null ? 'unchecked' : photosIds.has(photosId) ? 'ok' : 'missing';
    return { photo, driveStatus, photosStatus };
  });

  const localDriveIds = new Set(photos.map((p) => p.cloudBackup?.googleDrive).filter(Boolean));
  const localPhotosIds = new Set(photos.map((p) => p.cloudBackup?.googlePhotos).filter(Boolean));
  const orphanedDrive = (driveFiles || []).filter((f) => !localDriveIds.has(f.id) && !importedIds.has(f.id));
  const orphanedPhotos = (photosItems || []).filter((p) => !localPhotosIds.has(p.id) && !importedIds.has(p.id));

  const totalLocal = photos.length;
  const backedUpDrive = photos.filter((p) => p.cloudBackup?.googleDrive).length;
  const backedUpPhotos = photos.filter((p) => p.cloudBackup?.googlePhotos).length;
  const backedUpNowhere = photos.filter((p) => !p.cloudBackup?.googleDrive && !p.cloudBackup?.googlePhotos).length;

  const markImporting = (id, isImporting) => {
    setImportingIds((prev) => {
      const next = new Set(prev);
      if (isImporting) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const importDriveFile = async (file) => {
    markImporting(file.id, true);
    setImportErrors((prev) => {
      const next = { ...prev };
      delete next[file.id];
      return next;
    });
    try {
      const blob = await downloadDriveFile(user.accessToken, file.id);
      const asFile = new File([blob], file.name, { type: file.mimeType || blob.type || 'image/jpeg' });
      const photo = await onImport(asFile, { tags: [] });
      if (photo) {
        await onImportBackupTag({ ...photo, cloudBackup: { ...photo.cloudBackup, googleDrive: file.id } });
      }
      setImportedIds((prev) => new Set(prev).add(file.id));
      refreshStorageEstimate();
    } catch (err) {
      setImportErrors((prev) => ({ ...prev, [file.id]: err.message || 'Import failed.' }));
    } finally {
      markImporting(file.id, false);
    }
  };

  const importGooglePhoto = async (item) => {
    markImporting(item.id, true);
    setImportErrors((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    try {
      const blob = await downloadGooglePhotoBytes(item);
      const fileName = item.filename || `${item.id}.jpg`;
      const asFile = new File([blob], fileName, { type: item.mimeType || blob.type || 'image/jpeg' });
      const photo = await onImport(asFile, { tags: [] });
      if (photo) {
        await onImportBackupTag({ ...photo, cloudBackup: { ...photo.cloudBackup, googlePhotos: item.id } });
      }
      setImportedIds((prev) => new Set(prev).add(item.id));
      refreshStorageEstimate();
    } catch (err) {
      setImportErrors((prev) => ({ ...prev, [item.id]: err.message || 'Import failed.' }));
    } finally {
      markImporting(item.id, false);
    }
  };

  const importAll = async () => {
    setImportingAll(true);
    // Sequential on purpose: each import writes a full-size photo into
    // IndexedDB, and running Drive + Photos downloads all at once would
    // both hammer the API rate limits and make per-item progress unreadable.
    for (const file of orphanedDrive) {
      await importDriveFile(file);
    }
    for (const item of orphanedPhotos) {
      await importGooglePhoto(item);
    }
    setImportingAll(false);
  };

  const totalOrphaned = orphanedDrive.length + orphanedPhotos.length;
  const usagePct = storageEstimate?.quota
    ? Math.min(100, Math.round((storageEstimate.usage / storageEstimate.quota) * 100))
    : null;

  return (
    <div className="storage-ledger">
      <h1 className="storage-ledger__title">🗄️ Storage Ledger</h1>
      <p className="storage-ledger__intro">
        This device's local library is the one place with the most room to keep everything —
        Google Drive and Google Photos backups are useful, but they're scattered across
        whichever device made them. Bring backups from other devices/sessions in here, and
        check how much room is left to do it.
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
        <div className="ledger-stat">
          <span className="ledger-stat__value">{backedUpDrive}</span>
          <span className="ledger-stat__label">☁️ Marked backed up to Drive</span>
        </div>
        <div className="ledger-stat">
          <span className="ledger-stat__value">{backedUpPhotos}</span>
          <span className="ledger-stat__label">🖼️ Marked backed up to Photos</span>
        </div>
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
                ? "Fetch what's actually in your Google Drive and Google Photos backup folders right now, and compare it against this device's records."
                : 'Sign in with Google and grant Drive/Photos access to reconcile against your cloud storage — until then, only the local counts above are available.'}
            </p>
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
                  <th>Google Drive</th>
                  <th>Google Photos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ photo, driveStatus, photosStatus }) => (
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
                    <td><StatusPill status={driveStatus} /></td>
                    <td><StatusPill status={photosStatus} /></td>
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
                Backed up under this Google account — likely from another device or browser —
                but missing from this device's local library. Add them here so everything
                lives in one place.
              </p>
            </div>
            <button className="ledger-btn" onClick={importAll} disabled={importingAll}>
              {importingAll ? 'Adding all…' : `Add All to This Device (${totalOrphaned})`}
            </button>
          </div>

          {orphanedDrive.length > 0 && (
            <div className="ledger-orphan-group">
              <h3 className="ledger-orphan-title">☁️ Google Drive ({orphanedDrive.length})</h3>
              <ul className="ledger-orphan-list">
                {orphanedDrive.map((f) => (
                  <li key={f.id} className="ledger-orphan-item">
                    <div>
                      <a href={f.webViewLink} target="_blank" rel="noreferrer">{f.name}</a>
                      {f.createdTime && (
                        <span className="ledger-orphan-date">
                          {' '}· {new Date(f.createdTime).toLocaleDateString()}
                        </span>
                      )}
                      {importErrors[f.id] && <p className="ledger-error ledger-error--inline">⚠️ {importErrors[f.id]}</p>}
                    </div>
                    <button
                      className="ledger-btn ledger-btn--sm"
                      onClick={() => importDriveFile(f)}
                      disabled={importingIds.has(f.id) || importingAll}
                    >
                      {importingIds.has(f.id) ? 'Adding…' : 'Add to This Device'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {orphanedPhotos.length > 0 && (
            <div className="ledger-orphan-group">
              <h3 className="ledger-orphan-title">🖼️ Google Photos ({orphanedPhotos.length})</h3>
              <ul className="ledger-orphan-list">
                {orphanedPhotos.map((p) => (
                  <li key={p.id} className="ledger-orphan-item">
                    <div>
                      <a href={p.productUrl || '#'} target="_blank" rel="noreferrer">
                        {p.filename || p.id}
                      </a>
                      {importErrors[p.id] && <p className="ledger-error ledger-error--inline">⚠️ {importErrors[p.id]}</p>}
                    </div>
                    <button
                      className="ledger-btn ledger-btn--sm"
                      onClick={() => importGooglePhoto(p)}
                      disabled={importingIds.has(p.id) || importingAll}
                    >
                      {importingIds.has(p.id) ? 'Adding…' : 'Add to This Device'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
