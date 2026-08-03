/**
 * OneDrive storage service for photo backup.
 * Uses the Microsoft Graph API, scoped to the app's special "App Folder"
 * (approot) rather than the person's whole OneDrive — matches the
 * dedicated-backup-folder pattern used for Google Drive.
 */

const GRAPH_API = 'https://graph.microsoft.com/v1.0';
const APP_FOLDER = `${GRAPH_API}/me/drive/special/approot`;

/**
 * Upload a photo into the app folder.
 * @returns {Promise<{id: string, name: string, webUrl: string}>}
 */
export async function uploadToOneDrive(accessToken, file, fileName) {
  const name = encodeURIComponent(fileName || file.name);
  const res = await fetch(`${APP_FOLDER}:/${name}:/content`, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'OneDrive upload failed');
  }

  return res.json();
}

/**
 * Delete a file from the app folder.
 */
export async function deleteFromOneDrive(accessToken, fileId) {
  const res = await fetch(`${GRAPH_API}/me/drive/items/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + accessToken },
  });
  if (!res.ok && res.status !== 204) {
    throw new Error('Failed to delete file from OneDrive');
  }
}

/**
 * List files in the app folder.
 */
export async function listOneDriveFiles(accessToken) {
  const res = await fetch(
    `${APP_FOLDER}/children?$select=id,name,size,createdDateTime,webUrl,file`,
    { headers: { Authorization: 'Bearer ' + accessToken } }
  );
  if (!res.ok) {
    throw new Error('Failed to list OneDrive files');
  }
  const data = await res.json();
  return (data.value || []).filter((item) => item.file); // exclude any sub-folders
}

/**
 * Download a file's raw bytes (used to restore a photo backed up in
 * OneDrive — e.g. from another device — into this device's local library).
 * @returns {Promise<Blob>}
 */
export async function downloadOneDriveFile(accessToken, fileId) {
  const res = await fetch(`${GRAPH_API}/me/drive/items/${fileId}/content`, {
    headers: { Authorization: 'Bearer ' + accessToken },
  });
  if (!res.ok) {
    throw new Error('Failed to download file from OneDrive');
  }
  return res.blob();
}
