import { handleError, ErrorCodes, AppError, asyncWrapper } from '../utils/errorHandler';

const DEFAULT_TIMEOUT = 30000;
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  getHeaders(additionalHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...additionalHeaders };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      timeout = DEFAULT_TIMEOUT,
      credentials = 'include'
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method,
      headers: this.getHeaders(headers),
      credentials,
      signal: AbortSignal.timeout(timeout)
    };

    if (body && method !== 'GET') {
      config.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new AppError(
          errorData.message || `HTTP error ${response.status}`,
          errorData.code || ErrorCodes.API_ERROR,
          response.status,
          errorData.details
        );
        throw error;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      
      return response.text();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw handleError(error, 'Request failed');
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  async uploadFile(endpoint, file, options = {}) {
    const { onProgress, ...rest } = options;
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (onProgress && 'upload' in HTMLProgressEvent.prototype) {
      headers['Content-Type'] = 'multipart/form-data';
    }

    return this.request(endpoint, {
      ...rest,
      method: 'POST',
      body: formData,
      headers: { ...headers, 'Content-Type': 'multipart/form-data' }
    });
  }

  async downloadFile(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      throw handleError({ status: response.status }, 'Download failed');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'download';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=(?:(\\?['"])(.*?)\1|([^;\n]*))/i);
      if (match) {
        filename = match[2] || match[3] || filename;
      }
    }
    return { blob, filename };
  }
}

export const api = new ApiService();

export async function fetchPhotos(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const { data, error } = await asyncWrapper(
    api.get(`/photos${queryParams ? `?${queryParams}` : ''}`),
    'Failed to fetch photos'
  );
  return { data, error };
}

export async function uploadPhoto(file, metadata = {}) {
  const { data, error } = await asyncWrapper(
    api.uploadFile('/photos/upload', file),
    'Failed to upload photo'
  );
  return { data, error };
}

export async function deletePhoto(id) {
  const { data, error } = await asyncWrapper(
    api.delete(`/photos/${id}`),
    'Failed to delete photo'
  );
  return { data, error };
}

export async function updatePhoto(id, updates) {
  const { data, error } = await asyncWrapper(
    api.patch(`/photos/${id}`, updates),
    'Failed to update photo'
  );
  return { data, error };
}

export async function fetchStorageInfo() {
  const { data, error } = await asyncWrapper(
    api.get('/storage'),
    'Failed to fetch storage info'
  );
  return { data, error };
}

export async function connectStorageService(service, credentials) {
  const { data, error } = await asyncWrapper(
    api.post(`/storage/connect`, { service, credentials }),
    'Failed to connect storage service'
  );
  return { data, error };
}

export async function disconnectStorageService(service) {
  const { data, error } = await asyncWrapper(
    api.post(`/storage/disconnect`, { service }),
    'Failed to disconnect storage service'
  );
  return { data, error };
}

export async function searchPhotos(query, filters = {}) {
  const { data, error } = await asyncWrapper(
    api.post('/search', { query, filters }),
    'Failed to search photos'
  );
  return { data, error };
}

export async function getAIInsights() {
  const { data, error } = await asyncWrapper(
    api.get('/ai/insights'),
    'Failed to fetch AI insights'
  );
  return { data, error };
}

export default api;