import React, { useState, useRef, useCallback } from 'react';
import TagManager from '../Tags/TagManager';
import LocationTag from '../Location/LocationTag';
import { uploadToDrive } from '../../services/googleDriveService';
import { uploadToGooglePhotos } from '../../services/googlePhotosService';
import { getAutoBackupPref } from '../../utils/preferences';
import './PhotoUpload.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function PhotoUpload({ onUpload, user }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [tags, setTags] = useState([]);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [backupToDrive, setBackupToDrive] = useState(() => getAutoBackupPref());
  const [backupToPhotos, setBackupToPhotos] = useState(() => getAutoBackupPref());
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name}: Unsupported file type`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File too large (max 20 MB)`;
    }
    return null;
  };

  const handleFilesSelected = useCallback((files) => {
    const fileArray = Array.from(files);
    const newErrors = [];
    const validFiles = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    setErrors(newErrors);
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...validFiles.filter((f) => !existingNames.has(f.name))];
    });
  }, []);

  const handleFileInput = (e) => handleFilesSelected(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setErrors([]);
    const newProgress = {};
    selectedFiles.forEach((f) => (newProgress[f.name] = 0));
    setUploadProgress(newProgress);

    for (const file of selectedFiles) {
      try {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 10 }));

        const photo = await onUpload(file, { tags, locationEnabled });

        setUploadProgress((prev) => ({ ...prev, [file.name]: 50 }));

        if (photo) {
          // Backup to Google Drive
          if (backupToDrive && user?.accessToken) {
            try {
              const driveFile = await uploadToDrive(user.accessToken, file, file.name);
              photo.cloudBackup = { ...photo.cloudBackup, googleDrive: driveFile.id };
              setUploadProgress((prev) => ({ ...prev, [file.name]: 75 }));
            } catch (err) {
              console.warn('Drive backup failed:', err.message);
            }
          }

          // Backup to Google Photos
          if (backupToPhotos && user?.accessToken) {
            try {
              const gPhoto = await uploadToGooglePhotos(user.accessToken, file);
              photo.cloudBackup = { ...photo.cloudBackup, googlePhotos: gPhoto?.id };
              setUploadProgress((prev) => ({ ...prev, [file.name]: 95 }));
            } catch (err) {
              console.warn('Google Photos backup failed:', err.message);
            }
          }
        }

        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
      } catch (err) {
        setErrors((prev) => [...prev, `${file.name}: ${err.message}`]);
        setUploadProgress((prev) => ({ ...prev, [file.name]: -1 }));
      }
    }

    setUploading(false);
    setSelectedFiles([]);
    setTags([]);
    setUploadProgress({});
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="photo-upload">
      <h2>Upload Photos</h2>

      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileInput}
          className="file-input-hidden"
          aria-label="Select photos to upload"
        />
        <div className="drop-zone-content">
          <span className="drop-icon">📤</span>
          <p className="drop-text">
            {isDragging ? 'Drop photos here!' : 'Click or drag photos here to upload'}
          </p>
          <p className="drop-hint">Supports JPG, PNG, GIF, WebP · Max 20 MB per file</p>
        </div>
      </div>

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h3>Selected ({selectedFiles.length})</h3>
          <div className="file-list">
            {selectedFiles.map((file, index) => {
              const progress = uploadProgress[file.name];
              return (
                <div key={`${file.name}-${index}`} className="file-item">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="file-preview"
                  />
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatSize(file.size)}</span>
                    {progress !== undefined && progress > 0 && (
                      <div className="progress-bar-wrap">
                        <div
                          className={`progress-bar ${progress === -1 ? 'error' : ''}`}
                          style={{ width: `${progress === -1 ? 100 : progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {!uploading && (
                    <button
                      className="remove-file-btn"
                      onClick={() => removeFile(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="upload-errors">
          {errors.map((err, i) => (
            <p key={i} className="upload-error">
              ⚠️ {err}
            </p>
          ))}
        </div>
      )}

      {/* Upload Options */}
      <div className="upload-options">
        <h3>Upload Options</h3>

        {/* Tags */}
        <div className="option-section">
          <label className="option-label">Tags</label>
          <TagManager tags={tags} onChange={setTags} />
        </div>

        {/* Location */}
        <div className="option-section">
          <LocationTag enabled={locationEnabled} onToggle={setLocationEnabled} />
        </div>

        {/* Cloud Backup */}
        <div className="option-section">
          <label className="option-label">Cloud Backup</label>
          <div className="backup-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={backupToDrive}
                onChange={(e) => setBackupToDrive(e.target.checked)}
              />
              Backup to Google Drive
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={backupToPhotos}
                onChange={(e) => setBackupToPhotos(e.target.checked)}
              />
              Backup to Google Photos
            </label>
          </div>
        </div>
      </div>

      <button
        className="upload-btn"
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || uploading}
      >
        {uploading
          ? `Uploading ${selectedFiles.length} photo(s)...`
          : `Upload ${selectedFiles.length} Photo(s)`}
      </button>
    </div>
  );
}

export default PhotoUpload;
