import { renderHook, act, waitFor } from '@testing-library/react';
import { usePhotos } from './usePhotos';
import { createMockPhoto, createMockFile, waitForAsync, flushPromises } from '../setupTests';

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          add: jest.fn(),
          get: jest.fn(),
          getAll: jest.fn(),
          put: jest.fn(),
          delete: jest.fn(),
          index: jest.fn()
        }))
      }))
    }
  }))
};

// Mock the indexedDB utility
jest.mock('../utils/indexedDB', () => ({
  initDB: jest.fn(() => Promise.resolve({
    photos: {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      index: jest.fn()
    }
  })),
  addPhoto: jest.fn(),
  getPhotos: jest.fn(),
  getPhoto: jest.fn(),
  updatePhoto: jest.fn(),
  deletePhoto: jest.fn(),
  searchPhotos: jest.fn()
}));

describe('usePhotos Hook', () => {
  const mockUser = { id: 'test-user-1', email: 'test@example.com' };
  const mockPhoto = createMockPhoto();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    test('returns initial state correctly', () => {
      const { result } = renderHook(() => usePhotos(null));
      
      expect(result.current.photos).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
    });

    test('loads photos for authenticated user', async () => {
      const { getPhotos } = require('../utils/indexedDB');
      getPhotos.mockResolvedValue([mockPhoto]);

      const { result } = renderHook(() => usePhotos(mockUser));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.photos).toEqual([mockPhoto]);
      expect(getPhotos).toHaveBeenCalled();
    });

    test('handles null user gracefully', async () => {
      const { result } = renderHook(() => usePhotos(null));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.photos).toEqual([]);
    });
  });

  describe('addPhoto', () => {
    test('adds photo successfully', async () => {
      const { addPhoto } = require('../utils/indexedDB');
      addPhoto.mockResolvedValue(mockPhoto);

      const { result } = renderHook(() => usePhotos(mockUser));
      
      const newPhotoData = {
        name: 'New Photo',
        url: 'https://example.com/new.jpg',
        size: 2048,
        type: 'image/jpeg',
        width: 1024,
        height: 768,
        tags: ['test'],
        isFavorite: false,
        isArchived: false,
        albums: [],
        backups: [],
        hash: 'new-hash',
        orientation: 1,
        colorSpace: 'sRGB'
      };

      let addedPhoto;
      await act(async () => {
        addedPhoto = await result.current.addPhoto(newPhotoData);
      });

      expect(addedPhoto).toEqual(mockPhoto);
      expect(addPhoto).toHaveBeenCalledWith(expect.objectContaining(newPhotoData));
      expect(result.current.photos).toContain(mockPhoto);
    });

    test('handles addPhoto error', async () => {
      const { addPhoto } = require('../utils/indexedDB');
      addPhoto.mockRejectedValue(new Error('Failed to add photo'));

      const { result } = renderHook(() => usePhotos(mockUser));
      
      const photoData = {
        name: 'New Photo',
        url: 'https://example.com/new.jpg',
        size: 2048,
        type: 'image/jpeg',
        width: 1024,
        height: 768,
        tags: [],
        isFavorite: false,
        isArchived: false,
        albums: [],
        backups: [],
        hash: 'new-hash',
        orientation: 1,
        colorSpace: 'sRGB'
      };

      await act(async () => {
        await expect(result.current.addPhoto(photoData)).rejects.toThrow('Failed to add photo');
      });

      expect(result.current.error).toBeTruthy();
    });

    test('prevents adding duplicate photos by hash', async () => {
      const { getPhotos, addPhoto } = require('../utils/indexedDB');
      getPhotos.mockResolvedValue([mockPhoto]);
      addPhoto.mockRejectedValue(new Error('Photo already exists'));

      const { result } = renderHook(() => usePhotos(mockUser));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const duplicatePhotoData = {
        ...mockPhoto,
        name: 'Duplicate Photo'
      };

      await act(async () => {
        await expect(result.current.addPhoto(duplicatePhotoData)).rejects.toThrow('Photo already exists');
      });

      expect(result.current.photos).toHaveLength(1);
    });
  });

  describe('updatePhoto', () => {
    test('updates photo successfully', async () => {
      const { updatePhoto } = require('../utils/indexedDB');
      const updatedPhoto = { ...mockPhoto, name: 'Updated Photo' };
      updatePhoto.mockResolvedValue(updatedPhoto);

      const { result } = renderHook(() => usePhotos(mockUser));
      
      await act(async () => {
        const resultPhoto = await result.current.updatePhoto(mockPhoto.id, { name: 'Updated Photo' });
        expect(resultPhoto).toEqual(updatedPhoto);
      });

      expect(updatePhoto).toHaveBeenCalledWith(mockPhoto.id, { name: 'Updated Photo' });
    });

    test('handles updatePhoto error', async () => {
      const { updatePhoto } = require('../utils/indexedDB');
      updatePhoto.mockRejectedValue(new Error('Failed to update photo'));

      const { result } = renderHook(() => usePhotos(mockUser));
      
      await act(async () => {
        await expect(result.current.updatePhoto(mockPhoto.id, { name: 'Updated Photo' }))
          .rejects.toThrow('Failed to update photo');
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('deletePhoto', () => {
    test('deletes photo successfully', async () => {
      const { deletePhoto: deletePhotoFromDB } = require('../utils/indexedDB');
      deletePhotoFromDB.mockResolvedValue(true);

      const { result } = renderHook(() => usePhotos(mockUser));
      
      await act(async () => {
        await result.current.deletePhoto(mockPhoto.id);
      });

      expect(deletePhotoFromDB).toHaveBeenCalledWith(mockPhoto.id);
    });

    test('handles deletePhoto error', async () => {
      const { deletePhoto: deletePhotoFromDB } = require('../utils/indexedDB');
      deletePhotoFromDB.mockRejectedValue(new Error('Failed to delete photo'));

      const { result } = renderHook(() => usePhotos(mockUser));
      
      await act(async () => {
        await expect(result.current.deletePhoto(mockPhoto.id))
          .rejects.toThrow('Failed to delete photo');
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('getPhoto', () => {
    test('retrieves single photo successfully', async () => {
      const { getPhoto } = require('../utils/indexedDB');
      getPhoto.mockResolvedValue(mockPhoto);

      const { result } = renderHook(() => usePhotos(mockUser));
      
      const photo = await result.current.getPhoto(mockPhoto.id);
      
      expect(photo).toEqual(mockPhoto);
      expect(getPhoto).toHaveBeenCalledWith(mockPhoto.id);
    });

    test('returns null for non-existent photo', async () => {
      const { getPhoto } = require('../utils/indexedDB');
      getPhoto.mockResolvedValue(null);

      const { result } = renderHook(() => usePhotos(mockUser));
      
      const photo = await result.current.getPhoto('non-existent-id');
      
      expect(photo).toBeNull();
    });
  });

  describe('searchPhotos', () => {
    test('searches photos successfully', async () => {
      const { searchPhotos } = require('../utils/indexedDB');
      const mockSearchResult = {
        photos: [mockPhoto],
        total: 1,
        facets: {
          tags: { test: 1 },
          albums: {},
          cameras: {},
          locations: {},
          dates: {}
        }
      };
      searchPhotos.mockResolvedValue(mockSearchResult);

      const { result } = renderHook(() => usePhotos(mockUser));
      
      const searchResult = await result.current.searchPhotos({ query: 'test' });
      
      expect(searchResult).toEqual(mockSearchResult);
      expect(searchPhotos).toHaveBeenCalledWith({ query: 'test' });
    });

    test('handles search with filters', async () => {
      const { searchPhotos } = require('../utils/indexedDB');
      searchPhotos.mockResolvedValue({ photos: [], total: 0, facets: {} });

      const { result } = renderHook(() => usePhotos(mockUser));
      
      const filters = {
        query: 'nature',
        tags: ['landscape'],
        isFavorite: true
      };
      
      await result.current.searchPhotos(filters);
      
      expect(searchPhotos).toHaveBeenCalledWith(filters);
    });
  });

  describe('importPhotos', () => {
    test('imports photos from files successfully', async () => {
      const { addPhoto } = require('../utils/indexedDB');
      addPhoto.mockResolvedValue(mockPhoto);

      const { result } = renderHook(() => usePhotos(mockUser));
      
      const mockFiles = [createMockFile()];
      
      const importedPhotos = await act(async () => {
        return await result.current.importPhotos(mockFiles);
      });

      expect(importedPhotos).toEqual([mockPhoto]);
      expect(addPhoto).toHaveBeenCalledTimes(1);
    });

    test('handles import with multiple files', async () => {
      const { addPhoto } = require('../utils/indexedDB');
      addPhoto.mockResolvedValue(mockPhoto);

      const { result } = renderHook(() => usePhotos(mockUser));
      
      const mockFiles = [
        createMockFile({ name: 'photo1.jpg' }),
        createMockFile({ name: 'photo2.jpg' })
      ];
      
      const importedPhotos = await act(async () => {
        return await result.current.importPhotos(mockFiles);
      });

      expect(importedPhotos).toHaveLength(2);
      expect(addPhoto).toHaveBeenCalledTimes(2);
    });

    test('filters out non-image files', async () => {
      const { addPhoto } = require('../utils/indexedDB');

      const { result } = renderHook(() => usePhotos(mockUser));
      
      const mockFiles = [
        createMockFile({ name: 'photo.jpg' }),
        createMockFile({ name: 'document.pdf', type: 'application/pdf' })
      ];
      
      const importedPhotos = await act(async () => {
        return await result.current.importPhotos(mockFiles);
      });

      expect(importedPhotos).toHaveLength(1);
      expect(addPhoto).toHaveBeenCalledTimes(1);
    });
  });

  describe('exportPhotos', () => {
    test('exports photos as zip successfully', async () => {
      const { result } = renderHook(() => usePhotos(mockUser));
      
      const mockBlob = new Blob(['test'], { type: 'application/zip' });
      
      // Mock URL.createObjectURL and download
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      global.document.createElement = jest.fn(() => ({
        href: '',
        download: '',
        click: jest.fn()
      }));
      
      const exportedBlob = await result.current.exportPhotos([mockPhoto.id], 'zip');
      
      expect(exportedBlob).toBeInstanceOf(Blob);
      expect(exportedBlob.type).toBe('application/zip');
    });

    test('handles export with different formats', async () => {
      const { result } = renderHook(() => usePhotos(mockUser));
      
      const formats = ['jpg', 'png', 'webp'];
      
      for (const format of formats) {
        const exportedBlob = await result.current.exportPhotos([mockPhoto.id], format);
        expect(exportedBlob).toBeInstanceOf(Blob);
      }
    });
  });

  describe('Error Handling', () => {
    test('handles IndexedDB initialization error', async () => {
      const { initDB } = require('../utils/indexedDB');
      initDB.mockRejectedValue(new Error('Failed to initialize DB'));

      const { result } = renderHook(() => usePhotos(mockUser));
      
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
      
      expect(result.current.error.message).toContain('Failed to initialize DB');
    });

    test('recovers from temporary errors', async () => {
      const { getPhotos } = require('../utils/indexedDB');
      getPhotos
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce([mockPhoto]);

      const { result, rerender } = renderHook(() => usePhotos(mockUser));
      
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
      
      // Retry by simulating a re-render
      rerender();
      
      await waitFor(() => {
        expect(result.current.photos).toEqual([mockPhoto]);
      });
    });
  });

  describe('Performance', () => {
    test('does not make unnecessary API calls', async () => {
      const { getPhotos } = require('../utils/indexedDB');
      getPhotos.mockResolvedValue([mockPhoto]);

      const { result, rerender } = renderHook(() => usePhotos(mockUser));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const initialCallCount = getPhotos.mock.calls.length;
      
      // Re-render with same user
      rerender();
      
      expect(getPhotos).toHaveBeenCalledTimes(initialCallCount);
    });

    test('handles large photo collections efficiently', async () => {
      const { getPhotos } = require('../utils/indexedDB');
      const largePhotoSet = Array.from({ length: 1000 }, (_, i) => 
        createMockPhoto({ id: `photo-${i}` })
      );
      getPhotos.mockResolvedValue(largePhotoSet);

      const { result } = renderHook(() => usePhotos(mockUser));
      
      await waitFor(() => {
        expect(result.current.photos).toHaveLength(1000);
      });
      
      // Should still be performant
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});