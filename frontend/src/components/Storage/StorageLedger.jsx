import { useState } from 'react';
import { listDriveFiles } from '../../services/googleDriveService';
import { listGooglePhotos } from '../../services/googlePhotosService';
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

function StatusPill({ status }) {
  if (status === 'ok') return <span className="ledger-status ledger-status--ok">✔ Backed up</span>;
  if (status === 'missing') return <span className="ledger-status ledger-status--missing">⚠ Missing remotely</span>;
  if (status === 'unchecked') return <span className="ledger-status ledger-status--unchecked">Marked backed up</span>;
  return <span className="ledger-status ledger-status--none">— Not backed up</span>;
}

export default function StorageLedger({ photos, user }) {
  const [driveFiles, setDriveFiles] = useState(null); // null = not checked yet this session
  const [photosItems, setPhotosItems] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const scope = user?.scope || '';
  const hasDriveAccess = Boolean(user?.accessToken) && scope.includes('drive.file');
  const hasPhotosAccess = Boolean(user?.accessToken) && scope.includes('photoslibrary');
  const canReconcile = hasDriveAccess || hasPhotosAccess;

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
  const orphanedDrive = (driveFiles || []).filter((f) => !localDriveIds.has(f.id));
  const orphanedPhotos = (photosItems || []).filter((p) => !localPhotosIds.has(p.id));

  const totalLocal = photos.length;
  const backedUpDrive = photos.filter((p) => p.cloudBackup?.googleDrive).length;
  const backedUpPhotos = photos.filter((p) => p.cloudBackup?.googlePhotos).length;
  const backedUpNowhere = photos.filter((p) => !p.cloudBackup?.googleDrive && !p.cloudBackup?.googlePhotos).length;

  return (
    <div className="storage-ledger">
      <h1 className="storage-ledger__title">🗄️ Storage Ledger</h1>
      <p className="storage-ledger__intro">
        Every photo lives in this browser's local storage first. Google Drive and Google
        Photos are optional, one-way backups on top of that — this page reconciles what's
        recorded locally against what's actually still out there in your connected cloud
        storage.
      </p>

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
                ? 'Fetch what\'s actually in your Google Drive and Google Photos backup folders right now, and compare it against this device\'s records.'
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

      {/* Orphaned remote files — evidence of backups this device doesn't know about */}
      {(orphanedDrive.length > 0 || orphanedPhotos.length > 0) && (
        <div className="ledger-section">
          <h2 className="ledger-section__title">Found in the Cloud, Not on This Device</h2>
          <p className="ledger-section__desc">
            These were backed up under this Google account — likely from another device or
            browser — but this device's local library has no record of them.
          </p>
          {orphanedDrive.length > 0 && (
            <div className="ledger-orphan-group">
              <h3 className="ledger-orphan-title">☁️ Google Drive ({orphanedDrive.length})</h3>
              <ul className="ledger-orphan-list">
                {orphanedDrive.map((f) => (
                  <li key={f.id}>
                    <a href={f.webViewLink} target="_blank" rel="noreferrer">{f.name}</a>
                    {f.createdTime && (
                      <span className="ledger-orphan-date">
                        {' '}· {new Date(f.createdTime).toLocaleDateString()}
                      </span>
                    )}
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
                  <li key={p.id}>
                    <a href={p.productUrl || '#'} target="_blank" rel="noreferrer">
                      {p.filename || p.id}
                    </a>
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
