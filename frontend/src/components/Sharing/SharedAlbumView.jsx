import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getAllAlbums, getAllPhotos } from '../../utils/indexedDB';
import { decodeSharePayload } from '../../utils/shareLink';
import './SharedAlbumView.css';

function SharedAlbumView() {
  const { token } = useParams();
  const location = useLocation();
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadAlbum() {
      try {
        // Same-device viewing: if this browser is the one that created the
        // album, IndexedDB has the freshest copy — prefer it.
        const albums = await getAllAlbums();
        const localAlbum = albums.find((a) => a.shareToken === token);

        if (localAlbum) {
          setAlbum(localAlbum);
          if (localAlbum.isPublic) {
            const allPhotos = await getAllPhotos();
            setPhotos(allPhotos.filter((p) => localAlbum.photos.includes(p.id)));
          }
          return;
        }

        // Cross-device viewing: fall back to the snapshot baked into the
        // link itself, since there's no server to look the album up on.
        const encoded = location.hash.slice(1);
        const payload = encoded ? decodeSharePayload(encoded) : null;

        if (!payload) {
          setNotFound(true);
          return;
        }

        setAlbum({
          name: payload.name,
          createdAt: payload.createdAt,
          isPublic: payload.isPublic,
          photos: (payload.photos || []).map((p) => p.id),
        });
        setPhotos(payload.isPublic ? payload.photos || [] : []);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadAlbum();
  }, [token, location.hash]);

  if (loading) {
    return (
      <div className="shared-album-page">
        <div className="shared-album-loading">
          <div className="loading-spinner" />
          <p>Loading album…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="shared-album-page">
        <div className="shared-album-message">
          <span className="shared-album-icon">🔍</span>
          <h2>Album not found</h2>
          <p>This share link is invalid or the album has been deleted.</p>
          <Link to="/" className="shared-album-home-link">Go to Pic-Pocket</Link>
        </div>
      </div>
    );
  }

  if (!album.isPublic) {
    return (
      <div className="shared-album-page">
        <div className="shared-album-message">
          <span className="shared-album-icon">🔒</span>
          <h2>Private album</h2>
          <p>This album is private and cannot be viewed publicly.</p>
          <Link to="/" className="shared-album-home-link">Go to Pic-Pocket</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-album-page">
      <header className="shared-album-header">
        <h1 className="shared-album-title">{album.name}</h1>
        <p className="shared-album-meta">
          {photos.length} photo{photos.length !== 1 ? 's' : ''} ·{' '}
          Shared on {new Date(album.createdAt).toLocaleDateString()}
        </p>
      </header>

      {photos.length === 0 ? (
        <div className="shared-album-message">
          <span className="shared-album-icon">📭</span>
          <p>No photos available in this album.</p>
        </div>
      ) : (
        <div className="shared-album-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="shared-album-thumb">
              <img
                src={photo.thumbnail || photo.dataUrl}
                alt={photo.fileName}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SharedAlbumView;
