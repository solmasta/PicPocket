const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let errorCode = 'UNKNOWN_ERROR';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
      errorCode = errorData.code || errorCode;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new ApiError(errorMessage, response.status, errorCode);
  }
  return response.json();
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const api = {
  async get(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
      });
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network request failed', 0, 'NETWORK_ERROR');
    }
  },

  async post(endpoint, data, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network request failed', 0, 'NETWORK_ERROR');
    }
  },

  async put(endpoint, data, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network request failed', 0, 'NETWORK_ERROR');
    }
  },

  async delete(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
      });
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network request failed', 0, 'NETWORK_ERROR');
    }
  },

  async upload(endpoint, formData, onProgress) {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Upload failed', 0, 'UPLOAD_ERROR');
    }
  },
};

export { api, ApiError };
export default api;