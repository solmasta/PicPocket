import axios from 'axios';
import { handleError, ErrorCodes, AppError, withErrorHandling } from '../utils/errorHandler';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8787/api',
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(handleError(error, 'Request configuration failed'))
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/';
    }
    return Promise.reject(handleError(error, 'Request failed'));
  }
);

export async function fetchPhotos(params = {}) {
  return withErrorHandling(
    api.get('/photos', { params }),
    'Failed to fetch photos'
  );
}

export async function uploadPhoto(file, metadata = {}) {
  const formData = new FormData();
  formData.append('file', file);
  Object.entries(metadata).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return withErrorHandling(
    api.post('/photos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    'Failed to upload photo'
  );
}

export async function deletePhoto(id) {
  return withErrorHandling(
    api.delete(`/photos/${id}`),
    'Failed to delete photo'
  );
}

export async function updatePhoto(id, updates) {
  return withErrorHandling(
    api.patch(`/photos/${id}`, updates),
    'Failed to update photo'
  );
}

export async function fetchStorageInfo() {
  return withErrorHandling(
    api.get('/storage'),
    'Failed to fetch storage info'
  );
}

export async function connectStorageService(service, credentials) {
  return withErrorHandling(
    api.post('/storage/connect', { service, credentials }),
    'Failed to connect storage service'
  );
}

export async function disconnectStorageService(service) {
  return withErrorHandling(
    api.post('/storage/disconnect', { service }),
    'Failed to disconnect storage service'
  );
}

export async function searchPhotos(query, filters = {}) {
  return withErrorHandling(
    api.post('/search', { query, filters }),
    'Failed to search photos'
  );
}

export async function getAIInsights() {
  return withErrorHandling(
    api.get('/ai/insights'),
    'Failed to fetch AI insights'
  );
}

export async function syncPhoto(photoId, provider) {
  return withErrorHandling(
    api.post(`/photos/${photoId}/sync`, { provider }),
    'Failed to sync photo'
  );
}

export async function batchSync(photoIds, provider) {
  return withErrorHandling(
    api.post('/photos/batch-sync', { photoIds, provider }),
    'Failed to batch sync photos'
  );
}

export default api;