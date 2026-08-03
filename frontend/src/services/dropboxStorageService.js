/**
 * Dropbox storage service for photo backup.
 * Uses the Dropbox API v2, scoped to a dedicated "/PicPals Backup" folder —
 * matches the dedicated-backup-folder pattern used for Google Drive.
 */

const CONTENT_API = 'https://content.dropboxapi.com/2';
const API = 'https://api.dropboxapi.com/2';
const BACKUP_FOLDER = '/PicPals Backup';

/**
 * Upload a photo into the backup folder.
 * @returns {Promise<{id: string, name: string, path_display: string}>}
 */
export async function uploadToDropbox(accessToken, file, fileName) {
  const res = await fetch(`${CONTENT_API}/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path: `${BACKUP_FOLDER}/${fileName || file.name}`,
        mode: 'add',
        autorename: true,
        mute: true,
      }),
    },
    body: file,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_summary || 'Dropbox upload failed');
  }

  return res.json();
}

/**
 * Delete a file from Dropbox.
 */
export async function deleteFromDropbox(accessToken, path) {
  const res = await fetch(`${API}/files/delete_v2`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    throw new Error('Failed to delete file from Dropbox');
  }
}

/**
 * List files in the backup folder.
 */
export async function listDropboxFiles(accessToken) {
  const res = await fetch(`${API}/files/list_folder`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: BACKUP_FOLDER }),
  });

  if (res.status === 409) {
    // Folder doesn't exist yet (no backups made) — not an error.
    return [];
  }
  if (!res.ok) {
    throw new Error('Failed to list Dropbox files');
  }

  const data = await res.json();
  return (data.entries || []).filter((entry) => entry['.tag'] === 'file');
}

/**
 * Download a file's raw bytes (used to restore a photo backed up in
 * Dropbox — e.g. from another device — into this device's local library).
 * @returns {Promise<Blob>}
 */
export async function downloadDropboxFile(accessToken, path) {
  const res = await fetch(`${CONTENT_API}/files/download`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Dropbox-API-Arg': JSON.stringify({ path }),
    },
  });
  if (!res.ok) {
    throw new Error('Failed to download file from Dropbox');
  }
  return res.blob();
}
