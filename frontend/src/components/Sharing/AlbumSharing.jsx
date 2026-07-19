import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveAlbum, getAllAlbums, deleteAlbum } from '../../utils/indexedDB';
import './AlbumSharing.css';

function AlbumSharing({ photos, user }) {
  const [albums, setAlbums] = useState([]);
  const [albumName, setAlbumName] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [activeAlbum, setActiveAlbum] = useState(null);

  React.useEffect(() => {
    getAllAlbums().then((all) => setAlbums(all.filter((a) => a.userId === user?.id)));
  }, [user?.id]);

  const togglePhotoSelection = (photo) => {
    setSelectedPhotos((prev) => {
      const exists = prev.find((p) => p.id === photo.id);
      if (exists) return prev.filter((p) => p.id !== photo.id);
      return [...prev, photo];
    });
  };

  const createAlbum = async () => {
    if (!albumName.trim() || selectedPhotos.length === 0) return;
    setCreating(true);

    const album = {
      id: uuidv4(),
      userId: user.id,
      name: albumName.trim(),
      photos: selectedPhotos.map((p) => p.id),
      isPublic,
      createdAt: new Date().toISOString(),
      shareToken: uuidv4(),
    };

    await saveAlbum(album);
    setAlbums((prev) => [album, ...prev]);
    setAlbumName('');
    setSelectedPhotos([]);
    setIsPublic(false);
    setCreating(false);
  };

  const removeAlbum = async (albumId) => {
    await deleteAlbum(albumId);
    setAlbums((prev) => prev.filter((a) => a.id !== albumId));
  };

  const generateShareLink = (album) => {
    const link = `${window.location.origin}/album/${album.shareToken}`;
    setShareLink(link);
    setActiveAlbum(album);
    navigator.clipboard?.writeText(link);
  };

  const toggleAlbumPrivacy = async (album) => {
    const updated = { ...album, isPublic: !album.isPublic };
    await saveAlbum(updated);
    setAlbums((prev) => prev.map((a) => (a.id === album.id ? updated : a)));
  };

  return (
    <div className="album-sharing">
      <h2>Albums & Sharing</h2>

      <div className="sharing-layout">
        {/* Create album */}
        <div className="create-album-panel">
          <h3>Create Album</h3>

          <div className="form-field">
            <label htmlFor="album-name">Album Name</label>
            <input
              id="album-name"
              type="text"
              className="text-input"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              placeholder="e.g. Summer 2024"
            />
          </div>

          <div className="form-field">
            <label>Privacy</label>
            <div className="privacy-options">
              <button
                className={`privacy-btn ${!isPublic ? 'active' : ''}`}
                onClick={() => setIsPublic(false)}
              >
                🔒 Private
              </button>
              <button
                className={`privacy-btn ${isPublic ? 'active' : ''}`}
                onClick={() => setIsPublic(true)}
              >
                🌐 Public
              </button>
            </div>
          </div>

          <div className="form-field">
            <label>Select Photos ({selectedPhotos.length})</label>
            <div className="photo-picker-grid">
              {photos.map((photo) => {
                const selected = selectedPhotos.some((p) => p.id === photo.id);
                return (
                  <div
                    key={photo.id}
                    className={`picker-thumb ${selected ? 'selected' : ''}`}
                    onClick={() => togglePhotoSelection(photo)}
                  >
                    <img
                      src={photo.thumbnail || photo.dataUrl}
                      alt={photo.fileName}
                    />
                    {selected && <span className="check-mark">✓</span>}
                  </div>
                );
              })}
              {photos.length === 0 && (
                <p className="empty-hint">No photos available</p>
              )}
            </div>
          </div>

          <button
            className="create-album-btn"
            onClick={createAlbum}
            disabled={creating || !albumName.trim() || selectedPhotos.length === 0}
          >
            {creating ? 'Creating...' : 'Create Album'}
          </button>
        </div>

        {/* Albums list */}
        <div className="albums-list-panel">
          <h3>My Albums ({albums.length})</h3>
          {albums.length === 0 ? (
            <div className="no-albums">
              <span>📁</span>
              <p>No albums yet. Create your first album!</p>
            </div>
          ) : (
            <div className="albums-list">
              {albums.map((album) => {
                const albumPhotos = photos.filter((p) => album.photos.includes(p.id));
                const cover = albumPhotos[0];
                return (
                  <div key={album.id} className="album-card">
                    <div className="album-cover">
                      {cover ? (
                        <img
                          src={cover.thumbnail || cover.dataUrl}
                          alt={album.name}
                        />
                      ) : (
                        <span className="album-placeholder">📁</span>
                      )}
                    </div>
                    <div className="album-info">
                      <h4 className="album-name">{album.name}</h4>
                      <p className="album-meta">
                        {album.photos.length} photo{album.photos.length !== 1 ? 's' : ''} ·{' '}
                        <span className={`privacy-badge ${album.isPublic ? 'public' : 'private'}`}>
                          {album.isPublic ? '🌐 Public' : '🔒 Private'}
                        </span>
                      </p>
                      <p className="album-date">
                        {new Date(album.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="album-actions">
                      <button
                        className="album-action-btn"
                        onClick={() => toggleAlbumPrivacy(album)}
                        title={album.isPublic ? 'Make Private' : 'Make Public'}
                      >
                        {album.isPublic ? '🔒' : '🌐'}
                      </button>
                      <button
                        className="album-action-btn share"
                        onClick={() => generateShareLink(album)}
                        title="Share Album"
                      >
                        🔗
                      </button>
                      <button
                        className="album-action-btn delete"
                        onClick={() => removeAlbum(album.id)}
                        title="Delete Album"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Share link popup */}
          {shareLink && activeAlbum && (
            <div className="share-popup">
              <div className="share-popup-header">
                <h4>Share "{activeAlbum.name}"</h4>
                <button onClick={() => setShareLink('')}>✕</button>
              </div>
              <div className="share-link-row">
                <input type="text" value={shareLink} readOnly className="share-link-input" />
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard?.writeText(shareLink);
                  }}
                >
                  Copy
                </button>
              </div>
              <p className="share-note">
                Link copied to clipboard! {!activeAlbum.isPublic && '(Album is private — make it public to share)'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlbumSharing;
