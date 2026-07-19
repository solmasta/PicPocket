import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const user = JSON.parse(sessionStorage.getItem('picpals-user') || 'null');
  if (user?.accessToken) {
    config.headers.Authorization = 'Bearer ' + user.accessToken;
  }
  return config;
});

// ---- Photo operations ----

export async function uploadPhotoToServer(formData) {
  const response = await api.post('/photos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function fetchServerPhotos() {
  const response = await api.get('/photos');
  return response.data;
}

export async function deleteServerPhoto(photoId) {
  const response = await api.delete(`/photos/${photoId}`);
  return response.data;
}

export async function updateServerPhoto(photoId, updates) {
  const response = await api.patch(`/photos/${photoId}`, updates);
  return response.data;
}

// ---- Album operations ----

export async function createAlbum(albumData) {
  const response = await api.post('/albums', albumData);
  return response.data;
}

export async function fetchAlbums() {
  const response = await api.get('/albums');
  return response.data;
}

export async function updateAlbum(albumId, updates) {
  const response = await api.patch(`/albums/${albumId}`, updates);
  return response.data;
}

export async function deleteAlbum(albumId) {
  const response = await api.delete(`/albums/${albumId}`);
  return response.data;
}

// ---- Tag operations ----

export async function searchByTag(tag) {
  const response = await api.get(`/tags/search?tag=${encodeURIComponent(tag)}`);
  return response.data;
}

export async function fetchAllTags() {
  const response = await api.get('/tags');
  return response.data;
}

// ---- AI operations ----

export async function autoTagPhoto(photoId) {
  const response = await api.post(`/ai/autotag/${photoId}`);
  return response.data;
}

export async function faceRecognition(photoId) {
  const response = await api.post(`/ai/faces/${photoId}`);
  return response.data;
}

export default api;
