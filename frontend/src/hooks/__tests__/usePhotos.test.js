import { renderHook, act, waitFor } from '@testing-library/react';
import { usePhotos } from '../usePhotos';

jest.mock('../../utils/indexedDB', () => ({
  getAllPhotos: jest.fn(),
  savePhoto: jest.fn(),
  deletePhoto: jest.fn(),
}));

jest.mock('../../utils/imageFilters', () => ({
  resizeImage: jest.fn(),
  createThumbnail: jest.fn(),
}));

jest.mock('../../utils/contentHash', () => ({
  hashFile: jest.fn(),
}));

import * as indexedDB from '../../utils/indexedDB';
import { resizeImage, createThumbnail } from '../../utils/imageFilters';
import { hashFile } from '../../utils/contentHash';

describe('usePhotos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resizeImage.mockResolvedValue('data:image/jpeg;base64,resized');
    createThumbnail.mockResolvedValue('data:image/jpeg;base64,thumb');
    hashFile.mockResolvedValue('deadbeef');
    indexedDB.getAllPhotos.mockResolvedValue([]);
    indexedDB.savePhoto.mockResolvedValue();
    indexedDB.deletePhoto.mockResolvedValue();
  });

  test('loads local photos on mount, newest first', async () => {
    const older = { id: '1', fileName: 'old.jpg', uploadDate: '2024-01-01T00:00:00.000Z' };
    const newer = { id: '2', fileName: 'new.jpg', uploadDate: '2024-06-01T00:00:00.000Z' };
    indexedDB.getAllPhotos.mockResolvedValue([older, newer]);

    const { result } = renderHook(() => usePhotos({ id: 'user-1' }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.photos.map((p) => p.id)).toEqual(['2', '1']);
  });

  test('addPhoto resizes, thumbnails, hashes, and saves the photo locally', async () => {
    const { result } = renderHook(() => usePhotos({ id: 'user-1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const file = new File(['bytes'], 'horse.jpg', { type: 'image/jpeg' });

    let photo;
    await act(async () => {
      photo = await result.current.addPhoto(file, { tags: ['horse'] });
    });

    expect(resizeImage).toHaveBeenCalledWith(file);
    expect(hashFile).toHaveBeenCalledWith(file);
    expect(photo).toMatchObject({
      fileName: 'horse.jpg',
      tags: ['horse'],
      dataUrl: 'data:image/jpeg;base64,resized',
      thumbnail: 'data:image/jpeg;base64,thumb',
      contentHash: 'deadbeef',
      cloudBackup: {},
    });
    expect(indexedDB.savePhoto).toHaveBeenCalledWith(expect.objectContaining({ id: photo.id }));
    expect(result.current.photos[0].id).toBe(photo.id);
  });

  test('updatePhoto persists changes and merges them into state', async () => {
    indexedDB.getAllPhotos.mockResolvedValue([{ id: '1', fileName: 'a.jpg', cloudBackup: {} }]);
    const { result } = renderHook(() => usePhotos({ id: 'user-1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updatePhoto({ id: '1', fileName: 'a.jpg', cloudBackup: { googleDrive: 'g1' } });
    });

    expect(indexedDB.savePhoto).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', cloudBackup: { googleDrive: 'g1' } })
    );
    expect(result.current.photos[0].cloudBackup).toEqual({ googleDrive: 'g1' });
  });

  test('deletePhoto removes it from IndexedDB and state', async () => {
    indexedDB.getAllPhotos.mockResolvedValue([{ id: '1', fileName: 'a.jpg' }]);
    const { result } = renderHook(() => usePhotos({ id: 'user-1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deletePhoto('1');
    });

    expect(indexedDB.deletePhoto).toHaveBeenCalledWith('1');
    expect(result.current.photos).toEqual([]);
  });
});
