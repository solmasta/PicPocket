/**
 * Google Drive service for photo backup
 * Uses the Google Drive REST API v3
 */

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const PICPALS_FOLDER_NAME = 'PicPals Backup';

/**
 * Get or create the PicPals backup folder in Google Drive
 */
async function getOrCreateFolder(accessToken) {
  // Search for existing folder
  const searchRes = await fetch(
    `${DRIVE_API}/files?q=name='${PICPALS_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
    { headers: { Authorization: 'Bearer ' + accessToken } }
  );
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: PICPALS_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const folder = await createRes.json();
  return folder.id;
}

/**
 * Upload a photo to Google Drive
 * @param {string} accessToken - Google OAuth access token
 * @param {File} file - Photo file
 * @param {string} fileName - File name to use
 * @returns {Promise<{id: string, webViewLink: string}>}
 */
export async function uploadToDrive(accessToken, file, fileName) {
  const folderId = await getOrCreateFolder(accessToken);

  // Use multipart upload
  const metadata = {
    name: fileName || file.name,
    parents: [folderId],
  };

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  formData.append('file', file);

  const uploadRes = await fetch(
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,webViewLink,webContentLink`,
    {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + accessToken },
      body: formData,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(err.error?.message || 'Drive upload failed');
  }

  return uploadRes.json();
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFromDrive(accessToken, fileId) {
  const res = await fetch(`${DRIVE_API}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + accessToken },
  });
  if (!res.ok && res.status !== 204) {
    throw new Error('Failed to delete file from Google Drive');
  }
}

/**
 * List files in the PicPals Drive folder
 */
export async function listDriveFiles(accessToken) {
  const folderId = await getOrCreateFolder(accessToken);
  const res = await fetch(
    `${DRIVE_API}/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,size,createdTime,webViewLink)&orderBy=createdTime desc`,
    { headers: { Authorization: 'Bearer ' + accessToken } }
  );
  const data = await res.json();
  return data.files || [];
}
