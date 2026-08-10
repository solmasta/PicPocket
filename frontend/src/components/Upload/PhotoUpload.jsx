import React, { useState, useRef, useCallback } from 'react';
import TagManager from '../Tags/TagManager';
import LocationTag from '../Location/LocationTag';
import { uploadToDrive } from '../../services/googleDriveService';
import { uploadToGooglePhotos } from '../../services/googlePhotosService';
import { uploadToOneDrive } from '../../services/oneDriveStorageService';
import { uploadToDropbox } from '../../services/dropboxStorageService';
import { getAutoBackupPref } from '../../utils/preferences';
import './PhotoUpload.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function PhotoUpload({ onUpload, onBackupComplete, user, storageConnections }) {
  const scope = user?.scope || '';
  const hasDriveAccess = Boolean(user?.accessToken) && scope.includes('drive.file');
  const hasPhotosAccess = Boolean(user?.accessToken) && scope.includes('photoslibrary');
  const oneDriveConnection = storageConnections?.connections?.onedrive || null;
  const dropboxConnection = storageConnections?.connections?.dropbox || null;
  const hasOneDriveAccess = Boolean(oneDriveConnection?.accessToken);
  const hasDropboxAccess = Boolean(dropboxConnection?.accessToken);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [tags, setTags] = useState([]);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [backupToDrive, setBackupToDrive] = useState(() => getAutoBackupPref());
  const [backupToPhotos, setBackupToPhotos] = useState(() => getAutoBackupPref());
  const [backupToOneDrive, setBackupToOneDrive] = useState(() => getAutoBackupPref());
  const [backupToDropbox, setBackupToDropbox] = useState(() => getAutoBackupPref());
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
          if (backupToDrive && hasDriveAccess) {
            try {
              const driveFile = await uploadToDrive(user.accessToken, file, file.name);
              photo.cloudBackup = { ...photo.cloudBackup, googleDrive: driveFile.id };
              setUploadProgress((prev) => ({ ...prev, [file.name]: 75 }));
            } catch (err) {
              console.warn('Drive backup failed:', err.message);
              setErrors((prev) => [...prev, `${file.name}: Google Drive backup failed (${err.message})`]);
            }
          }

          // Backup to Google Photos
          if (backupToPhotos && hasPhotosAccess) {
            try {
              const gPhoto = await uploadToGooglePhotos(user.accessToken, file);
              photo.cloudBackup = { ...photo.cloudBackup, googlePhotos: gPhoto?.id };
              setUploadProgress((prev) => ({ ...prev, [file.name]: 95 }));
            } catch (err) {
              console.warn('Google Photos backup failed:', err.message);
              setErrors((prev) => [...prev, `${file.name}: Google Photos backup failed (${err.message})`]);
            }
          }

          // Backup to OneDrive
          if (backupToOneDrive && hasOneDriveAccess) {
            try {
              const oneDriveFile = await uploadToOneDrive(oneDriveConnection.accessToken, file, file.name);
              photo.cloudBackup = { ...photo.cloudBackup, oneDrive: oneDriveFile.id };
            } catch (err) {
              console.warn('OneDrive backup failed:', err.message);
              setErrors((prev) => [...prev, `${file.name}: OneDrive backup failed (${err.message})`]);
            }
          }

          // Backup to Dropbox
          if (backupToDropbox && hasDropboxAccess) {
            try {
              const dropboxFile = await uploadToDropbox(dropboxConnection.accessToken, file, file.name);
              photo.cloudBackup = { ...photo.cloudBackup, dropbox: dropboxFile.path_lower || dropboxFile.id };
            } catch (err) {
              console.warn('Dropbox backup failed:', err.message);
              setErrors((prev) => [...prev, `${file.name}: Dropbox backup failed (${err.message})`]);
            }
          }

          // Persist whatever backup status was achieved so it survives a
          // reload and shows up in the gallery's cloud badge — without
          // this, the upload* calls above only mutated the in-memory photo
          // object, never IndexedDB.
          if (
            photo.cloudBackup?.googleDrive ||
            photo.cloudBackup?.googlePhotos ||
            photo.cloudBackup?.oneDrive ||
            photo.cloudBackup?.dropbox
          ) {
            if (onBackupComplete) {
              await onBackupComplete(photo);
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

  // Auto-add horse tag if user has horse profile
  const addHorseTag = useCallback(async () => {
    if (!user) return;
    
    try {
      const { getHorseProfile } = await import('../../utils/indexedDB');
      const horseProfile = await getHorseProfile(user.id);
      if (horseProfile && horseProfile.fields && horseProfile.fields.name) {
        const horseName = horseProfile.fields.name.toLowerCase();
        if (!tags.includes(horseName)) {
          setTags(prev => [...prev, horseName]);
        }
      }
    } catch (err) {
      console.log('No horse profile found or error loading profile');
    }
  }, [user, tags]);

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
          <button 
            className="horse-tag-button"
            onClick={(e) => {
              e.stopPropagation();
              addHorseTag();
            }}
            type="button"
          >
            🐴 Add Horse Tag
          </button>
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
        <div className="upload-errors" role="alert">
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
            <label className={`checkbox-label ${!hasDriveAccess ? 'checkbox-label--disabled' : ''}`}>
              <input
                type="checkbox"
                checked={hasDriveAccess && backupToDrive}
                disabled={!hasDriveAccess}
                onChange={(e) => setBackupToDrive(e.target.checked)}
              />
              Backup to Google Drive
            </label>
            <label className={`checkbox-label ${!hasPhotosAccess ? 'checkbox-label--disabled' : ''}`}>
              <input
                type="checkbox"
                checked={hasPhotosAccess && backupToPhotos}
                disabled={!hasPhotosAccess}
                onChange={(e) => setBackupToPhotos(e.target.checked)}
              />
              Backup to Google Photos
            </label>
            <label className={`checkbox-label ${!hasOneDriveAccess ? 'checkbox-label--disabled' : ''}`}>
              <input
                type="checkbox"
                checked={hasOneDriveAccess && backupToOneDrive}
                disabled={!hasOneDriveAccess}
                onChange={(e) => setBackupToOneDrive(e.target.checked)}
              />
              Backup to OneDrive
            </label>
            <label className={`checkbox-label ${!hasDropboxAccess ? 'checkbox-label--disabled' : ''}`}>
              <input
                type="checkbox"
                checked={hasDropboxAccess && backupToDropbox}
                disabled={!hasDropboxAccess}
                onChange={(e) => setBackupToDropbox(e.target.checked)}
              />
              Backup to Dropbox
            </label>
          </div>
          {(!hasDriveAccess || !hasPhotosAccess) && (
            <p className="option-hint">
              Sign in with Google and grant Drive/Photos access in Settings to enable Google backup.
            </p>
          )}
          {(!hasOneDriveAccess || !hasDropboxAccess) && (
            <p className="option-hint">
              Connect OneDrive/Dropbox in Settings to enable backup there too.
            </p>
          )}
        </div>
      </div>

      <button
        className="upload-btn"
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || uploading}
        aria-busy={uploading}
      >
        {uploading
          ? `Uploading ${selectedFiles.length} photo(s)...`
          : `Upload ${selectedFiles.length} Photo(s)`}
      </button>
    </div>
  );
}

export default PhotoUpload;