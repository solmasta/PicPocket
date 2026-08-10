import api from './api';

export async function fetchPhotos(page = 1, limit = 20) {
  try {
    const response = await api.get(`/photos?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    throw error;
  }
}

export async function uploadPhoto(file, tags = [], location = null) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tags', JSON.stringify(tags));
    if (location) {
      formData.append('location', JSON.stringify(location));
    }
    
    const response = await api.post('/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to upload photo:', error);
    throw error;
  }
}

export async function deletePhoto(photoId) {
  try {
    const response = await api.delete(`/photos/${photoId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete photo:', error);
    throw error;
  }
}

export async function updatePhoto(photoId, updates) {
  try {
    const response = await api.put(`/photos/${photoId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Failed to update photo:', error);
    throw error;
  }
}

export async function searchPhotos(query) {
  try {
    const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Failed to search photos:', error);
    throw error;
  }
}

// Cloud backup functions
export async function backupToCloud(photoId, service) {
  try {
    const response = await api.post(`/photos/${photoId}/backup`, { service });
    return response.data;
  } catch (error) {
    console.error(`Failed to backup to ${service}:`, error);
    throw error;
  }
}

export async function getCloudBackupStatus(photoId) {
  try {
    const response = await api.get(`/photos/${photoId}/backup`);
    return response.data;
  } catch (error) {
    console.error('Failed to get backup status:', error);
    throw error;
  }
}