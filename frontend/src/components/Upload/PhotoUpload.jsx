import React, { useState, useRef, useCallback } from 'react';
import TagManager from '../Tags/TagManager';
import LocationTag from '../Location/LocationTag';
import { uploadToDrive } from '../../services/googleDriveService';
import { uploadToGooglePhotos } from '../../services/googlePhotosService';
import { uploadToOneDrive } from '../../services/oneDriveStorageService';
import { uploadToDropbox } from '../../services/dropboxService';
import { saveToIndexedDB, getAllPhotos } from '../../utils/indexedDB';
import './PhotoUpload.css';

function PhotoUpload({ onUploadComplete, onError }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [tags, setTags] = useState([]);
  const [location, setLocation] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    processFiles(files);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target?.files || []);
    processFiles(files);
  }, []);

  const processFiles = (files) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      onError?.('Please select image files only');
      return;
    }
    setSelectedFiles(imageFiles);
    setUploadStatus('preview');
  };

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateThumbnail = (dataUrl, maxSize = 400) => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploadStatus('uploading');
    const results = [];
    const existingPhotos = await getAllPhotos();
    const existingIds = new Set(existingPhotos.map((p) => p.id));

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: { progress: 0, status: 'reading' },
        }));

        const dataUrl = await readFileAsDataURL(file);
        const thumbnail = await generateThumbnail(dataUrl);

        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: { progress: 50, status: 'saving' },
        }));

        const photo = {
          id: fileId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          dataUrl,
          thumbnail,
          dateAdded: new Date().toISOString(),
          tags,
          location,
          cloudBackup: {},
        };

        await saveToIndexedDB(photo);
        results.push(photo);

        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: { progress: 100, status: 'complete' },
        }));

        try {
          await uploadToDrive(photo);
          photo.cloudBackup = { ...photo.cloudBackup, googleDrive: true };
          await saveToIndexedDB(photo);
        } catch (err) {
          console.warn('Google Drive upload failed:', err);
        }

        try {
          await uploadToGooglePhotos(photo);
          photo.cloudBackup = { ...photo.cloudBackup, googlePhotos: true };
          await saveToIndexedDB(photo);
        } catch (err) {
          console.warn('Google Photos upload failed:', err);
        }

        try {
          await uploadToOneDrive(photo);
          photo.cloudBackup = { ...photo.cloudBackup, oneDrive: true };
          await saveToIndexedDB(photo);
        } catch (err) {
          console.warn('OneDrive upload failed:', err);
        }

        try {
          await uploadToDropbox(photo);
          photo.cloudBackup = { ...photo.cloudBackup, dropbox: true };
          await saveToIndexedDB(photo);
        } catch (err) {
          console.warn('Dropbox upload failed:', err);
        }
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err);
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: { progress: 0, status: 'error', error: err.message },
        }));
      }
    }

    setUploadStatus('complete');
    onUploadComplete?.(results);
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setTags([]);
    setLocation(null);
    setUploadProgress({});
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (uploadStatus === 'idle') {
    return (
      <div className="photo-upload">
        <div className="photo-upload__dropzone-container">
          <div
            className={`photo-upload__dropzone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="photo-upload__input"
            />
            <div className="photo-upload__dropzone-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3 className="photo-upload__dropzone-title">Drop photos here</h3>
            <p className="photo-upload__dropzone-text">or click to browse</p>
            <p className="photo-upload__dropzone-hint">Supports JPG, PNG, GIF, WebP</p>
          </div>
        </div>
      </div>
    );
  }

  if (uploadStatus === 'preview') {
    return (
      <div className="photo-upload photo-upload--preview">
        <div className="photo-upload__preview-header">
          <h2>Selected Files ({selectedFiles.length})</h2>
          <button className="photo-upload__reset-btn" onClick={handleReset}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Clear all
          </button>
        </div>

        <div className="photo-upload__file-list">
          {selectedFiles.map((file, index) => (
            <div key={index} className="photo-upload__file-item">
              <div className="photo-upload__file-info">
                <span className="photo-upload__file-name">{file.name}</span>
                <span className="photo-upload__file-size">{formatFileSize(file.size)}</span>
              </div>
              <button
                className="photo-upload__file-remove"
                onClick={() => removeFile(index)}
                aria-label="Remove file"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="photo-upload__options">
          <div className="photo-upload__option-group">
            <label className="photo-upload__label">Tags</label>
            <TagManager tags={tags} onChange={setTags} />
          </div>
          <div className="photo-upload__option-group">
            <label className="photo-upload__label">Location</label>
            <LocationTag location={location} onChange={setLocation} />
          </div>
        </div>

        <button className="photo-upload__submit-btn" onClick={handleUpload}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'photo' : 'photos'}
        </button>
      </div>
    );
  }

  if (uploadStatus === 'uploading') {
    return (
      <div className="photo-upload photo-upload--uploading">
        <h2>Uploading...</h2>
        <div className="photo-upload__progress-list">
          {selectedFiles.map((file) => (
            <div key={file.name} className="photo-upload__progress-item">
              <div className="photo-upload__progress-info">
                <span className="photo-upload__progress-name">{file.name}</span>
                <span className="photo-upload__progress-status">
                  {uploadProgress[file.name]?.status === 'complete' ? 'Complete' : 'Processing...'}
                </span>
              </div>
              <div className="photo-upload__progress-bar">
                <div
                  className="photo-upload__progress-fill"
                  style={{ width: `${uploadProgress[file.name]?.progress || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="photo-upload photo-upload--complete">
      <div className="photo-upload__success-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2>Upload Complete!</h2>
      <p>{selectedFiles.length} {selectedFiles.length === 1 ? 'photo' : 'photos'} uploaded successfully</p>
      <button className="photo-upload__submit-btn" onClick={handleReset}>
        Upload More
      </button>
    </div>
  );
}

export default PhotoUpload;