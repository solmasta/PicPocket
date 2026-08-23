/**
 * Collaboration Manager Component
 * Handles photo sharing, albums, and social features
 * Real-time collaboration with comments and interactions
 */

import React, { useState, useEffect, useCallback } from 'react';
import './collaborationManager.css';

const CollaborationManager = ({ photos, user, onSharePhoto, onCreateAlbum }) => {
  const [sharedAlbums, setSharedAlbums] = useState([]);
  const [sharedPhotos, setSharedPhotos] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [comments, setComments] = useState({});
  const [likes, setLikes] = useState({});
  const [activeView, setActiveView] = useState('albums');
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadCollaborationData();
    setupRealtimeUpdates();
  }, []);

  const loadCollaborationData = async () => {
    try {
      // Load shared albums
      const albums = await loadSharedAlbums();
      setSharedAlbums(albums);

      // Load shared photos
      const photos = await loadSharedPhotos();
      setSharedPhotos(photos);

      // Load collaborators
      const collaborators = await loadCollaborators();
      setCollaborators(collaborators);

      // Load comments and likes
      const comments = await loadComments();
      setComments(comments);

      const likes = await loadLikes();
      setLikes(likes);

    } catch (error) {
      console.error('Failed to load collaboration data:', error);
    }
  };

  const setupRealtimeUpdates = () => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Check for new comments, likes, shares
      checkForUpdates();
    }, 5000);

    return () => clearInterval(interval);
  };

  const checkForUpdates = async () => {
    try {
      const updates = await checkForNewUpdates();
      if (updates.length > 0) {
        setNotifications(prev => [...updates, ...prev].slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  const createAlbum = async (albumData) => {
    try {
      const newAlbum = {
        id: 'album_' + Date.now(),
        name: albumData.name,
        description: albumData.description,
        photos: albumData.photos || [],
        collaborators: albumData.collaborators || [],
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        isPublic: albumData.isPublic || false,
        permissions: albumData.permissions || 'view'
      };

      await saveAlbum(newAlbum);
      setSharedAlbums(prev => [...prev, newAlbum]);
      setIsCreatingAlbum(false);
      
      // Notify collaborators
      notifyCollaborators(newAlbum, 'album_created');
      
      return newAlbum;
    } catch (error) {
      console.error('Failed to create album:', error);
      throw error;
    }
  };

  const sharePhoto = async (photoId, shareData) => {
    try {
      const shareInfo = {
        photoId,
        sharedBy: user.id,
        sharedWith: shareData.users || [],
        permissions: shareData.permissions || 'view',
        expiresAt: shareData.expiresAt,
        message: shareData.message,
        createdAt: new Date().toISOString()
      };

      await savePhotoShare(shareInfo);
      setSharedPhotos(prev => [...prev, shareInfo]);
      
      // Generate share link
      const link = generateShareLink('photo', photoId, shareInfo);
      setShareLink(link);
      
      // Notify users
      notifyUsers(shareData.users, 'photo_shared', { photoId, link });
      
      return shareInfo;
    } catch (error) {
      console.error('Failed to share photo:', error);
      throw error;
    }
  };

  const addComment = async (photoId, comment) => {
    try {
      const newComment = {
        id: 'comment_' + Date.now(),
        photoId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        content: comment,
        createdAt: new Date().toISOString(),
        replies: []
      };

      await saveComment(newComment);
      setComments(prev => ({
        ...prev,
        [photoId]: [...(prev[photoId] || []), newComment]
      }));

      // Notify photo owner and other commenters
      notifyCommentSubscribers(photoId, newComment);
      
      return newComment;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  };

  const likePhoto = async (photoId) => {
    try {
      const userId = user.id;
      const photoLikes = likes[photoId] || [];
      const isLiked = photoLikes.includes(userId);

      if (isLiked) {
        // Unlike
        await unlikePhoto(photoId, userId);
        setLikes(prev => ({
          ...prev,
          [photoId]: prev[photoId].filter(id => id !== userId)
        }));
      } else {
        // Like
        await likePhotoAction(photoId, userId);
        setLikes(prev => ({
          ...prev,
          [photoId]: [...(prev[photoId] || []), userId]
        }));

        // Notify photo owner
        notifyPhotoOwner(photoId, 'photo_liked');
      }
    } catch (error) {
      console.error('Failed to like photo:', error);
      throw error;
    }
  };

  const addCollaborator = async (albumId, userData) => {
    try {
      const collaborator = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        permissions: userData.permissions || 'view',
        addedBy: user.id,
        addedAt: new Date().toISOString()
      };

      await saveCollaborator(albumId, collaborator);
      
      setCollaborators(prev => ({
        ...prev,
        [albumId]: [...(prev[albumId] || []), collaborator]
      }));

      // Update album
      setSharedAlbums(prev => prev.map(album => 
        album.id === albumId 
          ? { ...album, collaborators: [...album.collaborators, collaborator.id] }
          : album
      ));

      // Send invitation
      sendInvitation(albumId, collaborator);
      
      return collaborator;
    } catch (error) {
      console.error('Failed to add collaborator:', error);
      throw error;
    }
  };

  const generateShareLink = (type, itemId, shareInfo) => {
    const baseUrl = window.location.origin;
    const token = btoa(JSON.stringify({ type, itemId, ...shareInfo }));
    return `${baseUrl}/shared/${token}`;
  };

  const notifyCollaborators = (album, action) => {
    // Simulate notification system
    console.log(`Notifying collaborators of ${action} for album ${album.id}`);
  };

  const notifyUsers = (users, action, data) => {
    // Simulate notification system
    console.log(`Notifying users of ${action}:`, data);
  };

  const notifyCommentSubscribers = (photoId, comment) => {
    // Simulate notification system
    console.log(`Notifying comment subscribers for photo ${photoId}`, comment);
  };

  const notifyPhotoOwner = (photoId, action) => {
    // Simulate notification system
    console.log(`Notifying photo owner of ${action} for photo ${photoId}`);
  };

  const sendInvitation = (albumId, collaborator) => {
    // Simulate email invitation
    console.log(`Sending invitation to ${collaborator.email} for album ${albumId}`);
  };

  // Mock API functions
  const loadSharedAlbums = async () => [
    {
      id: 'album_1',
      name: 'Summer Vacation 2023',
      description: 'Our amazing summer trip photos',
      photos: ['photo_1', 'photo_2', 'photo_3'],
      collaborators: ['user_2', 'user_3'],
      createdBy: 'user_1',
      createdAt: '2023-07-15T10:00:00Z',
      isPublic: false,
      permissions: 'view'
    },
    {
      id: 'album_2',
      name: 'Family Reunion',
      description: 'Family gathering photos',
      photos: ['photo_4', 'photo_5'],
      collaborators: ['user_3'],
      createdBy: 'user_1',
      createdAt: '2023-08-20T14:30:00Z',
      isPublic: true,
      permissions: 'comment'
    }
  ];

  const loadSharedPhotos = async () => [
    {
      photoId: 'photo_1',
      sharedBy: 'user_2',
      sharedWith: ['user_1'],
      permissions: 'view',
      createdAt: '2023-09-01T12:00:00Z'
    }
  ];

  const loadCollaborators = async () => ({
    album_1: [
      { id: 'user_2', name: 'Jane Doe', email: 'jane@example.com', avatar: 'avatar2.jpg', permissions: 'view' },
      { id: 'user_3', name: 'Bob Smith', email: 'bob@example.com', avatar: 'avatar3.jpg', permissions: 'comment' }
    ]
  });

  const loadComments = async () => ({
    photo_1: [
      {
        id: 'comment_1',
        photoId: 'photo_1',
        userId: 'user_2',
        userName: 'Jane Doe',
        userAvatar: 'avatar2.jpg',
        content: 'Beautiful photo!',
        createdAt: '2023-09-02T10:30:00Z',
        replies: []
      }
    ]
  });

  const loadLikes = async () => ({
    photo_1: ['user_1', 'user_3']
  });

  const saveAlbum = async (album) => console.log('Saving album:', album);
  const savePhotoShare = async (share) => console.log('Saving photo share:', share);
  const saveComment = async (comment) => console.log('Saving comment:', comment);
  const saveCollaborator = async (albumId, collaborator) => console.log('Saving collaborator:', collaborator);
  const likePhotoAction = async (photoId, userId) => console.log('Liking photo:', photoId, userId);
  const unlikePhoto = async (photoId, userId) => console.log('Unliking photo:', photoId, userId);
  const checkForNewUpdates = async () => [];

  return (
    <div className="collaboration-manager">
      <div className="collaboration-header">
        <h2>Collaboration</h2>
        <div className="view-tabs">
          {['albums', 'shared', 'activity'].map(view => (
            <button
              key={view}
              className={`tab-button ${activeView === view ? 'active' : ''}`}
              onClick={() => setActiveView(view)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeView === 'albums' && (
        <AlbumsView
          albums={sharedAlbums}
          collaborators={collaborators}
          selectedAlbum={selectedAlbum}
          onSelectAlbum={setSelectedAlbum}
          onCreateAlbum={() => setIsCreatingAlbum(true)}
          onAddCollaborator={addCollaborator}
        />
      )}

      {activeView === 'shared' && (
        <SharedView
          sharedPhotos={sharedPhotos}
          photos={photos}
          onSharePhoto={sharePhoto}
          shareLink={shareLink}
        />
      )}

      {activeView === 'activity' && (
        <ActivityView
          notifications={notifications}
          comments={comments}
          likes={likes}
          onAddComment={addComment}
          onLikePhoto={likePhoto}
        />
      )}

      {isCreatingAlbum && (
        <CreateAlbumModal
          photos={photos}
          onClose={() => setIsCreatingAlbum(false)}
          onCreate={createAlbum}
        />
      )}

      {selectedAlbum && (
        <AlbumDetailModal
          album={selectedAlbum}
          photos={photos}
          collaborators={collaborators[selectedAlbum.id] || []}
          comments={comments}
          likes={likes}
          onClose={() => setSelectedAlbum(null)}
          onAddComment={addComment}
          onLikePhoto={likePhoto}
          onAddCollaborator={(userData) => addCollaborator(selectedAlbum.id, userData)}
        />
      )}
    </div>
  );
};

// Albums View Component
const AlbumsView = ({ albums, collaborators, selectedAlbum, onSelectAlbum, onCreateAlbum, onAddCollaborator }) => (
  <div className="albums-view">
    <div className="albums-header">
      <h3>Shared Albums</h3>
      <button onClick={onCreateAlbum} className="create-album-btn">
        + Create Album
      </button>
    </div>

    <div className="albums-grid">
      {albums.map(album => (
        <div key={album.id} className="album-card" onClick={() => onSelectAlbum(album)}>
          <div className="album-thumbnail">
            <img src={`/api/thumbnails/${album.photos[0]}`} alt={album.name} />
            <div className="album-count">{album.photos.length} photos</div>
          </div>
          <div className="album-info">
            <h4>{album.name}</h4>
            <p>{album.description}</p>
            <div className="album-collaborators">
              {(collaborators[album.id] || []).slice(0, 3).map(collab => (
                <img key={collab.id} src={collab.avatar} alt={collab.name} className="collaborator-avatar" />
              ))}
              {(collaborators[album.id] || []).length > 3 && (
                <span className="more-collaborators">+{(collaborators[album.id] || []).length - 3}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Shared View Component
const SharedView = ({ sharedPhotos, photos, onSharePhoto, shareLink }) => (
  <div className="shared-view">
    <h3>Shared Photos</h3>
    <div className="shared-photos-grid">
      {sharedPhotos.map(share => {
        const photo = photos.find(p => p.id === share.photoId);
        return photo ? (
          <div key={share.photoId} className="shared-photo-card">
            <img src={photo.thumbnail} alt={photo.name} />
            <div className="shared-info">
              <p>Shared by {share.sharedBy}</p>
              <span className="permissions">{share.permissions}</span>
            </div>
          </div>
        ) : null;
      })}
    </div>

    {shareLink && (
      <div className="share-link-container">
        <h4>Share Link</h4>
        <div className="share-link">
          <input type="text" value={shareLink} readOnly />
          <button onClick={() => navigator.clipboard.writeText(shareLink)}>
            Copy
          </button>
        </div>
      </div>
    )}
  </div>
);

// Activity View Component
const ActivityView = ({ notifications, comments, likes, onAddComment, onLikePhoto }) => (
  <div className="activity-view">
    <h3>Recent Activity</h3>
    <div className="activity-feed">
      {notifications.map((notification, index) => (
        <div key={index} className="activity-item">
          <span className="activity-time">{new Date(notification.timestamp).toLocaleString()}</span>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  </div>
);

// Create Album Modal Component
const CreateAlbumModal = ({ photos, onClose, onCreate }) => {
  const [albumData, setAlbumData] = useState({
    name: '',
    description: '',
    photos: [],
    collaborators: [],
    isPublic: false,
    permissions: 'view'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onCreate(albumData);
      onClose();
    } catch (error) {
      console.error('Failed to create album:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Create Album</h3>
          <button onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Album Name</label>
            <input
              type="text"
              value={albumData.name}
              onChange={(e) => setAlbumData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={albumData.description}
              onChange={(e) => setAlbumData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Permissions</label>
            <select
              value={albumData.permissions}
              onChange={(e) => setAlbumData(prev => ({ ...prev, permissions: e.target.value }))}
            >
              <option value="view">View only</option>
              <option value="comment">View & Comment</option>
              <option value="edit">View, Comment & Edit</option>
            </select>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={albumData.isPublic}
                onChange={(e) => setAlbumData(prev => ({ ...prev, isPublic: e.target.checked }))}
              />
              Make public
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Create Album</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Album Detail Modal Component
const AlbumDetailModal = ({ album, photos, collaborators, comments, likes, onClose, onAddComment, onLikePhoto, onAddCollaborator }) => {
  const [newComment, setNewComment] = useState('');
  const [newCollaborator, setNewCollaborator] = useState({ email: '', permissions: 'view' });

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await onAddComment(album.photos[0], newComment);
      setNewComment('');
    }
  };

  const handleAddCollaborator = async () => {
    if (newCollaborator.email.trim()) {
      await onAddCollaborator({ ...newCollaborator, id: Date.now().toString(), name: newCollaborator.email });
      setNewCollaborator({ email: '', permissions: 'view' });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal album-detail-modal">
        <div className="modal-header">
          <h3>{album.name}</h3>
          <button onClick={onClose}>×</button>
        </div>
        
        <div className="album-content">
          <div className="album-photos">
            <h4>Photos</h4>
            <div className="photos-grid">
              {album.photos.map(photoId => {
                const photo = photos.find(p => p.id === photoId);
                return photo ? (
                  <div key={photoId} className="album-photo">
                    <img src={photo.thumbnail} alt={photo.name} />
                    <div className="photo-actions">
                      <button onClick={() => onLikePhoto(photoId)}>
                        ❤️ {(likes[photoId] || []).length}
                      </button>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <div className="album-comments">
            <h4>Comments</h4>
            <div className="comments-list">
              {album.photos.map(photoId => 
                (comments[photoId] || []).map(comment => (
                  <div key={comment.id} className="comment">
                    <img src={comment.userAvatar} alt={comment.userName} className="comment-avatar" />
                    <div className="comment-content">
                      <strong>{comment.userName}</strong>
                      <p>{comment.content}</p>
                      <small>{new Date(comment.createdAt).toLocaleString()}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="add-comment">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
              />
              <button onClick={handleAddComment}>Post</button>
            </div>
          </div>

          <div className="album-collaborators">
            <h4>Collaborators</h4>
            <div className="collaborators-list">
              {collaborators.map(collab => (
                <div key={collab.id} className="collaborator-item">
                  <img src={collab.avatar} alt={collab.name} />
                  <div>
                    <strong>{collab.name}</strong>
                    <small>{collab.permissions}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="add-collaborator">
              <input
                type="email"
                value={newCollaborator.email}
                onChange={(e) => setNewCollaborator(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email..."
              />
              <select
                value={newCollaborator.permissions}
                onChange={(e) => setNewCollaborator(prev => ({ ...prev, permissions: e.target.value }))}
              >
                <option value="view">View</option>
                <option value="comment">Comment</option>
                <option value="edit">Edit</option>
              </select>
              <button onClick={handleAddCollaborator}>Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationManager;