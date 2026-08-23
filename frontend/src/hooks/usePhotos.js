import { useState, useEffect, useCallback, useMemo } from 'react';
import * as indexedDB from '../utils/indexedDB';
import { resizeImage, createThumbnail } from '../utils/imageFilters';
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';
import { hashFile } from '../utils/contentHash';
import { handleError, withErrorHandling, logError, ErrorCodes } from '../utils/errorHandler';

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function usePhotos(user) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: err } = await withErrorHandling(
          indexedDB.getAllPhotos(),
          'Failed to load local photos'
        );
        
        if (cancelled) return;
        
        if (err) {
          logError('usePhotos.load', err);
          setError(err.message);
        } else {
          setPhotos(
            [...data].sort(
              (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
            )
          );
        }
      } catch (unexpectedErr) {
        if (!cancelled) {
          logError('usePhotos.unexpected', unexpectedErr);
          setError('An unexpected error occurred while loading photos');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addPhoto = useCallback(
    async (file, optionsOrTags = {}, maybeLocation = null) => {
      const isOptionsObject =
        optionsOrTags && !Array.isArray(optionsOrTags) && typeof optionsOrTags === 'object';
      const tags = isOptionsObject ? optionsOrTags.tags || [] : optionsOrTags || [];
      const locationEnabled = isOptionsObject ? Boolean(optionsOrTags.locationEnabled) : false;

      try {
        const [dataUrl, contentHash, thumbnail] = await Promise.all([
          resizeImage(file),
          hashFile(file),
          resizeImage(file).then(createThumbnail).catch(() => null),
        ]);

        let location = maybeLocation;
        if (!location && locationEnabled) {
          try {
            const position = await getCurrentPosition();
            const name = await reverseGeocode(position.lat, position.lng);
            location = { lat: position.lat, lng: position.lng, name };
          } catch (err) {
            console.warn('Could not capture location for photo:', err.message);
          }
        }

        const photo = {
          id: generateId(),
          userId: user?.id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadDate: new Date().toISOString(),
          tags: sanitizeInput(tags),
          location,
          cloudBackup: {},
          dataUrl,
          thumbnail,
          contentHash,
        };

        const { error: saveErr } = await withErrorHandling(
          indexedDB.savePhoto(photo),
          'Failed to save photo'
        );

        if (saveErr) {
          logError('usePhotos.addPhoto', saveErr);
          throw saveErr;
        }

        setPhotos((prev) => [photo, ...prev]);
        return photo;
      } catch (err) {
        logError('usePhotos.addPhoto', err);
        throw err;
      }
    },
    [user]
  );

  const updatePhoto = useCallback(async (updatedPhoto) => {
    if (!updatedPhoto?.id) return updatedPhoto;

    try {
      const sanitizedPhoto = {
        ...updatedPhoto,
        tags: sanitizeInput(updatedPhoto.tags || []),
        caption: sanitizeInput(updatedPhoto.caption || ''),
      };

      const { error: saveErr } = await withErrorHandling(
        indexedDB.savePhoto(sanitizedPhoto),
        'Failed to update photo'
      );

      if (saveErr) {
        logError('usePhotos.updatePhoto', saveErr);
        throw saveErr;
      }

      setPhotos((prev) =>
        prev.map((p) => (p.id === updatedPhoto.id ? { ...p, ...sanitizedPhoto } : p))
      );
      return sanitizedPhoto;
    } catch (err) {
      logError('usePhotos.updatePhoto', err);
      throw err;
    }
  }, []);

  const deletePhoto = useCallback(async (photoId) => {
    try {
      const { error: deleteErr } = await withErrorHandling(
        indexedDB.deletePhoto(photoId),
        'Failed to delete photo'
      );

      if (deleteErr) {
        logError('usePhotos.deletePhoto', deleteErr);
        throw deleteErr;
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      logError('usePhotos.deletePhoto', err);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const photoCount = useMemo(() => photos.length, [photos]);
  const unbackedPhotos = useMemo(
    () => photos.filter((p) => !p.cloudBackup || Object.keys(p.cloudBackup).length === 0),
    [photos]
  );

  const value = useMemo(() => ({
    photos,
    loading,
    error,
    addPhoto,
    updatePhoto,
    deletePhoto,
    clearError,
    photoCount,
    unbackedPhotos,
    hasUnbackedPhotos: unbackedPhotos.length > 0,
  }), [photos, loading, error, addPhoto, updatePhoto, deletePhoto, clearError, photoCount, unbackedPhotos]);

  return value;
}

function sanitizeInput(input) {
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item)).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, 500);
  }
  return input;
}

export default usePhotos;