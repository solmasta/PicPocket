import { useState, useEffect, useCallback } from 'react';
import * as indexedDB from '../utils/indexedDB';
import { resizeImage, createThumbnail } from '../utils/imageFilters';
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';
import { hashFile } from '../utils/contentHash';

// `crypto.randomUUID` is universal in real browsers but isn't always present
// as a bare global in test environments (jsdom under Jest), so fall back to
// a simpler unique id rather than referencing `crypto` unguarded.
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// PicPocket's library lives entirely in this browser's IndexedDB — there is
// no server-side photo store to sync with (see StorageLedger, which treats
// Google Drive/Photos, OneDrive and Dropbox as separate backup destinations
// to reconcile against, not a source of truth). This hook is the single
// place that reads/writes that local library.
export function usePhotos(user) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const localPhotos = await indexedDB.getAllPhotos();
        if (!cancelled) {
          setPhotos(
            [...localPhotos].sort(
              (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
            )
          );
        }
      } catch (err) {
        console.error('Failed to load local photos:', err);
        if (!cancelled) setError('Failed to load local photos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Adds a new photo to the local library. Accepts either the legacy
  // (tags, location) positional args or an options object
  // ({ tags, locationEnabled }) — PhotoUpload and StorageLedger both call
  // this with slightly different shapes.
  const addPhoto = useCallback(
    async (file, optionsOrTags = {}, maybeLocation = null) => {
      const isOptionsObject =
        optionsOrTags && !Array.isArray(optionsOrTags) && typeof optionsOrTags === 'object';
      const tags = isOptionsObject ? optionsOrTags.tags || [] : optionsOrTags || [];
      const locationEnabled = isOptionsObject ? Boolean(optionsOrTags.locationEnabled) : false;

      const [dataUrl, contentHash] = await Promise.all([
        resizeImage(file),
        hashFile(file),
      ]);
      const thumbnail = await createThumbnail(dataUrl);

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
        tags,
        location,
        cloudBackup: {},
        dataUrl,
        thumbnail,
        contentHash,
      };

      await indexedDB.savePhoto(photo);
      setPhotos((prev) => [photo, ...prev]);
      return photo;
    },
    [user]
  );

  // Persists a full (or partially-mutated) photo object back to the
  // library — used for cloud-backup tagging, AI tag/caption suggestions,
  // and filter edits.
  const updatePhoto = useCallback(async (updatedPhoto) => {
    if (!updatedPhoto?.id) return updatedPhoto;
    await indexedDB.savePhoto(updatedPhoto);
    setPhotos((prev) =>
      prev.map((p) => (p.id === updatedPhoto.id ? { ...p, ...updatedPhoto } : p))
    );
    return updatedPhoto;
  }, []);

  const deletePhoto = useCallback(async (photoId) => {
    await indexedDB.deletePhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  return {
    photos,
    loading,
    error,
    addPhoto,
    updatePhoto,
    deletePhoto,
  };
}
