/**
 * Utils/storageManager.js
 *
 * Utilities for storing and retrieving photos in PicPocket.
 * Handles local persistence (IndexedDB), Google Photos upload,
 * and Google Drive backup.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const DB_NAME = 'PicPocketDB';
const DB_VERSION = 1;
const PHOTOS_STORE = 'photos';
const ALBUMS_STORE = 'albums';

const GOOGLE_PHOTOS_UPLOAD_URL =
  'https://photoslibrary.googleapis.com/v1/uploads';
const GOOGLE_PHOTOS_MEDIA_URL =
  'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate';
const GOOGLE_DRIVE_UPLOAD_URL =
  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

// ─── IndexedDB helpers ───────────────────────────────────────────────────────

/**
 * Open (and initialise) the PicPocket IndexedDB database.
 *
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        const photoStore = db.createObjectStore(PHOTOS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        photoStore.createIndex('albumId', 'albumId', { unique: false });
        photoStore.createIndex('createdAt', 'createdAt', { unique: false });
        photoStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
      }

      if (!db.objectStoreNames.contains(ALBUMS_STORE)) {
        db.createObjectStore(ALBUMS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a photo record to local IndexedDB.
 *
 * @param {object} photo            - Photo metadata + blob.
 * @param {Blob}   photo.blob       - The raw image Blob.
 * @param {string} [photo.filename] - Original filename.
 * @param {object} [photo.location] - Location object (lat, lng, placeName).
 * @param {Array}  [photo.tags]     - Array of tag strings.
 * @param {number} [photo.albumId]  - Album the photo belongs to.
 * @returns {Promise<number>}       - The new photo's auto-generated ID.
 */
export async function savePhotoLocally(photo) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, 'readwrite');
    const store = tx.objectStore(PHOTOS_STORE);
    const record = {
      ...photo,
      createdAt: photo.createdAt || Date.now(),
    };
    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve a single photo by its local ID.
 *
 * @param {number} id
 * @returns {Promise<object|undefined>}
 */
export async function getPhotoById(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, 'readonly');
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve all photos, optionally filtered by album.
 *
 * @param {number} [albumId] - If provided, only photos in this album are returned.
 * @returns {Promise<Array<object>>}
 */
export async function getAllPhotos(albumId) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, 'readonly');
    const store = tx.objectStore(PHOTOS_STORE);

    let request;
    if (albumId !== undefined) {
      const index = store.index('albumId');
      request = index.getAll(albumId);
    } else {
      request = store.getAll();
    }

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update metadata for an existing local photo.
 *
 * @param {number} id      - Photo ID to update.
 * @param {object} updates - Partial fields to merge into the stored record.
 * @returns {Promise<void>}
 */
export async function updatePhoto(id, updates) {
  const existing = await getPhotoById(id);
  if (!existing) throw new Error(`Photo with id ${id} not found`);

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, 'readwrite');
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.put({ ...existing, ...updates, id });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a photo from local storage by ID.
 *
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deletePhotoLocally(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, 'readwrite');
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ─── Album helpers ───────────────────────────────────────────────────────────

/**
 * Create a new album in local storage.
 *
 * @param {object} album           - Album metadata.
 * @param {string} album.name      - Album name.
 * @param {string} [album.description]
 * @returns {Promise<number>}      - The new album's auto-generated ID.
 */
export async function createAlbum(album) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALBUMS_STORE, 'readwrite');
    const store = tx.objectStore(ALBUMS_STORE);
    const record = { ...album, createdAt: Date.now() };
    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve all albums from local storage.
 *
 * @returns {Promise<Array<object>>}
 */
export async function getAllAlbums() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALBUMS_STORE, 'readonly');
    const store = tx.objectStore(ALBUMS_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Google Photos backup ────────────────────────────────────────────────────

/**
 * Upload a single photo Blob to Google Photos.
 * Requires a valid OAuth2 access token with the
 * `https://www.googleapis.com/auth/photoslibrary.appendonly` scope.
 *
 * @param {Blob}   blob        - The image Blob to upload.
 * @param {string} filename    - Suggested filename for the media item.
 * @param {string} accessToken - Google OAuth2 access token.
 * @param {object} [options]
 * @param {string} [options.description] - Description for the media item.
 * @param {string} [options.albumId]     - Google Photos album ID to add the photo to.
 * @returns {Promise<object>}  - The created media item response from Google Photos API.
 */
export async function uploadToGooglePhotos(blob, filename, accessToken, options = {}) {
  // Step 1 – upload raw bytes and obtain an upload token
  const uploadResponse = await fetch(GOOGLE_PHOTOS_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/octet-stream',
      'X-Goog-Upload-File-Name': encodeURIComponent(filename),
      'X-Goog-Upload-Protocol': 'raw',
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Google Photos upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
  }

  const uploadToken = await uploadResponse.text();

  // Step 2 – create the media item from the upload token
  const newMediaItem = {
    description: options.description || '',
    simpleMediaItem: {
      displayName: filename,
      uploadToken,
    },
  };

  const body = { newMediaItems: [newMediaItem] };
  if (options.albumId) body.albumId = options.albumId;

  const createResponse = await fetch(GOOGLE_PHOTOS_MEDIA_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!createResponse.ok) {
    throw new Error(`Google Photos mediaItems create failed: ${createResponse.status} ${createResponse.statusText}`);
  }

  const result = await createResponse.json();
  const status = result.newMediaItemResults?.[0]?.status;
  if (status && status.code !== undefined && status.code !== 0) {
    throw new Error(`Google Photos media item error: ${status.message}`);
  }

  return result.newMediaItemResults?.[0]?.mediaItem;
}

// ─── Google Drive backup ─────────────────────────────────────────────────────

/**
 * Back up a photo Blob to Google Drive.
 * Requires a valid OAuth2 access token with the
 * `https://www.googleapis.com/auth/drive.file` scope.
 *
 * @param {Blob}   blob        - The image Blob to upload.
 * @param {string} filename    - Filename for the Drive file.
 * @param {string} accessToken - Google OAuth2 access token.
 * @param {object} [options]
 * @param {string} [options.folderId] - Parent folder ID in Drive.
 * @returns {Promise<object>}  - The created Drive file metadata.
 */
export async function backupToGoogleDrive(blob, filename, accessToken, options = {}) {
  const metadata = {
    name: filename,
    mimeType: blob.type || 'image/jpeg',
  };

  if (options.folderId) {
    metadata.parents = [options.folderId];
  }

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
  );
  formData.append('file', blob, filename);

  const response = await fetch(GOOGLE_DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Google Drive backup failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Export a batch of local photos to both Google Photos and Google Drive.
 * Skips items that fail without aborting the whole batch.
 *
 * @param {Array<{blob: Blob, filename: string, description?: string}>} items
 * @param {string} accessToken
 * @param {object} [options]
 * @param {string} [options.googlePhotosAlbumId]
 * @param {string} [options.driveFolderId]
 * @param {Function} [options.onProgress] - Called with (completed, total) after each item.
 * @returns {Promise<Array<{filename: string, success: boolean, error?: string}>>}
 */
export async function batchBackup(items, accessToken, options = {}) {
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const { blob, filename, description } = items[i];
    try {
      await Promise.all([
        uploadToGooglePhotos(blob, filename, accessToken, {
          description,
          albumId: options.googlePhotosAlbumId,
        }),
        backupToGoogleDrive(blob, filename, accessToken, {
          folderId: options.driveFolderId,
        }),
      ]);
      results.push({ filename, success: true });
    } catch (err) {
      results.push({ filename, success: false, error: err.message });
    }

    if (typeof options.onProgress === 'function') {
      options.onProgress(i + 1, items.length);
    }
  }

  return results;
}
