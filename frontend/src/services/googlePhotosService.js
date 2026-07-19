/**
 * Google Photos service for photo backup
 * Uses the Google Photos Library API
 */

const PHOTOS_API = 'https://photoslibrary.googleapis.com/v1';
const PICPALS_ALBUM_NAME = 'PicPals Backup';

/**
 * Get or create the PicPals album in Google Photos
 */
async function getOrCreateAlbum(accessToken) {
  // List albums
  const listRes = await fetch(`${PHOTOS_API}/albums`, {
    headers: { Authorization: 'Bearer ' + accessToken },
  });
  const listData = await listRes.json();

  if (listData.albums) {
    const existing = listData.albums.find((a) => a.title === PICPALS_ALBUM_NAME);
    if (existing) return existing.id;
  }

  // Create album
  const createRes = await fetch(`${PHOTOS_API}/albums`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ album: { title: PICPALS_ALBUM_NAME } }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'Failed to create Google Photos album');
  }

  const album = await createRes.json();
  return album.id;
}

/**
 * Upload a photo to Google Photos
 * Step 1: Upload bytes to get an upload token
 * Step 2: Create media item using the upload token
 */
export async function uploadToGooglePhotos(accessToken, file, description = '') {
  // Step 1: Upload raw bytes
  const uploadRes = await fetch(`${PHOTOS_API}/uploads`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/octet-stream',
      'X-Goog-Upload-Content-Type': file.type,
      'X-Goog-Upload-Protocol': 'raw',
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error('Failed to upload photo bytes to Google Photos');
  }

  const uploadToken = await uploadRes.text();

  // Step 2: Create media item
  const albumId = await getOrCreateAlbum(accessToken);
  const createRes = await fetch(`${PHOTOS_API}/mediaItems:batchCreate`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      albumId,
      newMediaItems: [
        {
          description,
          simpleMediaItem: {
            fileName: file.name,
            uploadToken,
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'Failed to create media item in Google Photos');
  }

  const result = await createRes.json();
  const item = result.newMediaItemResults?.[0]?.mediaItem;
  return item;
}

/**
 * List photos from Google Photos (PicPals album)
 */
export async function listGooglePhotos(accessToken, pageToken = null) {
  const albumId = await getOrCreateAlbum(accessToken);
  const body = {
    albumId,
    pageSize: 50,
  };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(`${PHOTOS_API}/mediaItems:search`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return {
    items: data.mediaItems || [],
    nextPageToken: data.nextPageToken,
  };
}
