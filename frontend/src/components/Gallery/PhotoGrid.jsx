import React from 'react';
import PhotoItem from './PhotoItem';
import './PhotoGrid.css';

function PhotoGrid({ photos, onDelete, onUpdateTags }) {
  if (!photos || photos.length === 0) {
    return (
      <div className="photo-grid empty">
        <p>No photos to display</p>
      </div>
    );
  }

  return (
    <div className="photo-grid">
      {photos.map(photo => (
        <PhotoItem
          key={photo.id}
          photo={photo}
          onDelete={onDelete}
          onUpdateTags={onUpdateTags}
        />
      ))}
    </div>
  );
}

export default PhotoGrid;