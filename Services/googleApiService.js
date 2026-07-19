import { getAccessToken } from './authService';

const PHOTOS_BASE_URL = 'https://photoslibrary.googleapis.com/v1';
const DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3';

/**
 * Build authorised fetch headers.
 */
const authHeaders = async () => {
  const token = await getAccessToken();
  return {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
  };
};

/**
 * Generic request helper with error handling.
 */
const request = async (url, options = {}) => {
  const headers = await authHeaders();
  const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API error ${response.status}: ${errorBody}`);
  }
  return response.json();
};

// ─── Google Photos ───────────────────────────────────────────────────────────

/**
 * List media items from the user's Google Photos library.
 * @param {object} params
 * @param {number} [params.pageSize=50] - Number of items to return (max 100).
 * @param {string} [params.pageToken]   - Token for the next page.
 * @returns {Promise<{mediaItems: object[], nextPageToken?: string}>}
 */
export const listPhotos = async ({ pageSize = 50, pageToken } = {}) => {
  const body = { pageSize };
  if (pageToken) body.pageToken = pageToken;

  return request(`${PHOTOS_BASE_URL}/mediaItems:search`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * Get a single media item by ID.
 * @param {string} mediaItemId
 * @returns {Promise<object>}
 */
export const getPhoto = async (mediaItemId) => {
  return request(`${PHOTOS_BASE_URL}/mediaItems/${encodeURIComponent(mediaItemId)}`);
};

/**
 * List all albums.
 * @param {object} params
 * @param {number} [params.pageSize=50]
 * @param {string} [params.pageToken]
 * @returns {Promise<{albums: object[], nextPageToken?: string}>}
 */
export const listAlbums = async ({ pageSize = 50, pageToken } = {}) => {
  const params = new URLSearchParams({ pageSize: String(pageSize) });
  if (pageToken) params.append('pageToken', pageToken);

  return request(`${PHOTOS_BASE_URL}/albums?${params.toString()}`);
};

/**
 * Create a new album.
 * @param {string} title
 * @returns {Promise<object>} The created album.
 */
export const createAlbum = async (title) => {
  return request(`${PHOTOS_BASE_URL}/albums`, {
    method: 'POST',
    body: JSON.stringify({ album: { title } }),
  });
};

/**
 * Add media items to an album.
 * @param {string} albumId
 * @param {string[]} mediaItemIds
 * @returns {Promise<object>}
 */
export const addPhotosToAlbum = async (albumId, mediaItemIds) => {
  return request(`${PHOTOS_BASE_URL}/albums/${encodeURIComponent(albumId)}:batchAddMediaItems`, {
    method: 'POST',
    body: JSON.stringify({ mediaItemIds }),
  });
};

/**
 * Upload a photo to Google Photos.
 * Performs a raw bytes upload, then creates the media item.
 * @param {object} params
 * @param {Uint8Array|ArrayBuffer} params.bytes - Raw image bytes.
 * @param {string} params.fileName             - File name (e.g. "photo.jpg").
 * @param {string} [params.albumId]            - Optional album to add the photo to.
 * @param {string} [params.description]        - Optional media item description.
 * @returns {Promise<object>} The created media item result.
 */
export const uploadPhoto = async ({ bytes, fileName, albumId, description }) => {
  const token = await getAccessToken();

  // Step 1: upload raw bytes to get an upload token
  const uploadResponse = await fetch(`${PHOTOS_BASE_URL}/uploads`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/octet-stream',
      'X-Goog-Upload-File-Name': fileName,
      'X-Goog-Upload-Protocol': 'raw',
    },
    body: bytes,
  });

  if (!uploadResponse.ok) {
    const errorBody = await uploadResponse.text();
    throw new Error(`Upload failed ${uploadResponse.status}: ${errorBody}`);
  }

  const uploadToken = await uploadResponse.text();

  // Step 2: create media item from the upload token
  const newMediaItem = { simpleMediaItem: { fileName, uploadToken } };
  if (description) newMediaItem.description = description;

  const body = { newMediaItems: [newMediaItem] };
  if (albumId) body.albumId = albumId;

  return request(`${PHOTOS_BASE_URL}/mediaItems:batchCreate`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

// ─── Google Drive ─────────────────────────────────────────────────────────────

/**
 * List files in Google Drive.
 * @param {object} params
 * @param {string} [params.query]      - Drive query string (e.g. "mimeType='image/jpeg'").
 * @param {number} [params.pageSize=50]
 * @param {string} [params.pageToken]
 * @param {string} [params.fields]     - Partial response fields mask.
 * @returns {Promise<{files: object[], nextPageToken?: string}>}
 */
export const listDriveFiles = async ({
  query,
  pageSize = 50,
  pageToken,
  fields = 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink, createdTime)',
} = {}) => {
  const params = new URLSearchParams({ pageSize: String(pageSize), fields });
  if (query) params.append('q', query);
  if (pageToken) params.append('pageToken', pageToken);

  return request(`${DRIVE_BASE_URL}/files?${params.toString()}`);
};

/**
 * Get metadata for a single Drive file.
 * @param {string} fileId
 * @returns {Promise<object>}
 */
export const getDriveFile = async (fileId) => {
  return request(`${DRIVE_BASE_URL}/files/${encodeURIComponent(fileId)}`);
};

/**
 * Create a folder in Google Drive.
 * @param {string} folderName
 * @param {string} [parentFolderId] - ID of the parent folder; defaults to root.
 * @returns {Promise<object>} The created folder metadata.
 */
export const createDriveFolder = async (folderName, parentFolderId) => {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) metadata.parents = [parentFolderId];

  return request(`${DRIVE_BASE_URL}/files`, {
    method: 'POST',
    body: JSON.stringify(metadata),
  });
};

/**
 * Upload a file to Google Drive using the multipart upload method.
 * @param {object} params
 * @param {Blob|string} params.content   - File content (Blob or base64 string).
 * @param {string}      params.fileName  - Desired file name.
 * @param {string}      params.mimeType  - MIME type of the file.
 * @param {string}      [params.folderId] - Parent folder ID.
 * @returns {Promise<object>} The created file metadata.
 */
export const uploadToDrive = async ({ content, fileName, mimeType, folderId }) => {
  const token = await getAccessToken();

  const metadata = { name: fileName, mimeType };
  if (folderId) metadata.parents = [folderId];

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
  );
  form.append('file', new Blob([content], { type: mimeType }), fileName);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: form,
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Drive upload failed ${response.status}: ${errorBody}`);
  }

  return response.json();
};

/**
 * Delete a file from Google Drive.
 * @param {string} fileId
 * @returns {Promise<void>}
 */
export const deleteDriveFile = async (fileId) => {
  const token = await getAccessToken();
  const response = await fetch(`${DRIVE_BASE_URL}/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token },
  });

  if (!response.ok && response.status !== 204) {
    const errorBody = await response.text();
    throw new Error(`Delete failed ${response.status}: ${errorBody}`);
  }
};
