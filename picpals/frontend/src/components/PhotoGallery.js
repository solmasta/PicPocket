import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchPhotos, uploadPhoto, deletePhoto } from '../services/photoService';

function PhotoGallery({ user }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPhotos(user.token);
      setPhotos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      await uploadPhoto(file, user.token);
      await loadPhotos();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    try {
      await deletePhoto(photoId, user.token);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading photos…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="photo-gallery">
      <header>
        <h1>PicPals Gallery</h1>
        <nav>
          <Link to="/settings">Settings</Link>
        </nav>
      </header>

      <div className="upload-section">
        <label htmlFor="photo-upload">
          {uploading ? 'Uploading…' : 'Upload Photo'}
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </div>

      {photos.length === 0 ? (
        <p>No photos yet. Upload your first photo!</p>
      ) : (
        <div className="photos-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="photo-card">
              <img src={photo.url} alt={photo.name} />
              <p>{photo.name}</p>
              {photo.horseId && (
                <Link to={'/horses/' + photo.horseId}>View Horse</Link>
              )}
              <button onClick={() => handleDelete(photo.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;
