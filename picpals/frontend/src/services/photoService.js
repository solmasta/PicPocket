import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function authHeaders(token) {
  return { Authorization: 'Bearer ' + token };
}

/**
 * Fetch all photos for the authenticated user.
 */
export async function fetchPhotos(token) {
  const response = await axios.get(API_BASE + '/api/photos', {
    headers: authHeaders(token),
  });
  return response.data;
}

/**
 * Upload a photo file.
 */
export async function uploadPhoto(file, token) {
  const formData = new FormData();
  formData.append('photo', file);
  const response = await axios.post(API_BASE + '/api/photos', formData, {
    headers: {
      ...authHeaders(token),
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Delete a photo by ID.
 */
export async function deletePhoto(photoId, token) {
  await axios.delete(API_BASE + '/api/photos/' + photoId, {
    headers: authHeaders(token),
  });
}

/**
 * Sync photos from Google Photos into PicPals.
 */
export async function syncFromGooglePhotos(token) {
  const response = await axios.post(
    API_BASE + '/api/photos/sync',
    {},
    { headers: authHeaders(token) }
  );
  return response.data;
}
