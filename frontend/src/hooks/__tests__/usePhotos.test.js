import { renderHook, act } from '@testing-library/react';
import { usePhotos } from '../usePhotos';

// Mock the IndexedDB utilities
jest.mock('../../utils/indexedDB', () => ({
  getAllPhotos: jest.fn(),
  savePhoto: jest.fn(),
  deletePhoto: jest.fn()
}));

// Mock the photo service
jest.mock('../../services/photoService', () => ({
  fetchPhotos: jest.fn(),
  uploadPhoto: jest.fn(),
  deletePhoto: jest.fn(),
  updatePhoto: jest.fn()
}));

import * as indexedDB from '../../utils/indexedDB';
import * as photoService from '../../services/photoService';

describe('usePhotos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should load local photos on mount', async () => {
    const mockPhotos = [
      { id: '1', fileName: 'test1.jpg', syncedToServer: true },
      { id: '2', fileName: 'test2.jpg', syncedToServer: false }
    ];
    
    indexedDB.getAllPhotos.mockResolvedValue(mockPhotos);
    
    const { result } = renderHook(() => usePhotos());
    
    // Wait for the effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.photos).toEqual(mockPhotos);
    expect(indexedDB.getAllPhotos).toHaveBeenCalled();
  });

  test('should fetch server photos with pagination', async () => {
    const mockResponse = {
      photos: [{ id: '3', fileName: 'test3.jpg' }],
      page: 1,
      limit: 20,
      total: 1
    };
    
    photoService.fetchPhotos.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => usePhotos());
    
    await act(async () => {
      await result.current.fetchServerPhotos(1);
    });
    
    expect(result.current.photos).toEqual(mockResponse.photos);
    expect(result.current.total).toBe(1);
    expect(photoService.fetchPhotos).toHaveBeenCalledWith(1);
  });

  test('should upload a photo and sync to server', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockLocalPhoto = {
      id: 'local_123',
      fileName: 'test.jpg',
      fileType: 'image/jpeg',
      fileSize: 4,
      uploadDate: expect.any(String),
      tags: [],
      location: null,
      cloudBackup: {},
      syncedToServer: false
    };
    
    const mockServerPhoto = {
      id: 'server_123',
      fileName: 'test.jpg',
      fileType: 'image/jpeg',
      fileSize: 4,
      uploadDate: expect.any(String),
      tags: [],
      location: null,
      cloudBackup: {},
      url: 'https://example.com/photos/server_123'
    };
    
    indexedDB.savePhoto.mockResolvedValue();
    photoService.uploadPhoto.mockResolvedValue(mockServerPhoto);
    
    const { result } = renderHook(() => usePhotos());
    
    await act(async () => {
      await result.current.uploadPhoto(mockFile);
    });
    
    expect(indexedDB.savePhoto).toHaveBeenCalledWith(mockLocalPhoto);
    expect(photoService.uploadPhoto).toHaveBeenCalledWith(mockFile, [], null);
    expect(indexedDB.savePhoto).toHaveBeenCalledWith({ ...mockServerPhoto, syncedToServer: true });
  });

  test('should delete a photo from both local and server', async () => {
    const mockPhotos = [
      { id: '1', fileName: 'test1.jpg', syncedToServer: true }
    ];
    
    indexedDB.getAllPhotos.mockResolvedValue(mockPhotos);
    indexedDB.deletePhoto.mockResolvedValue();
    photoService.deletePhoto.mockResolvedValue();
    
    const { result } = renderHook(() => usePhotos());
    
    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Delete photo
    await act(async () => {
      await result.current.deletePhoto('1');
    });
    
    expect(photoService.deletePhoto).toHaveBeenCalledWith('1');
    expect(indexedDB.deletePhoto).toHaveBeenCalledWith('1');
    expect(result.current.photos).toEqual([]);
  });
});