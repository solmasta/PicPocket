/**
 * Cloud Sync Component
 * Multi-cloud storage integration and synchronization
 * Supports Google Drive, OneDrive, Dropbox, and custom providers
 */

import React, { useState, useEffect, useCallback } from 'react';
import './cloudSync.css';

const CloudSync = ({ photos, onSyncComplete, onError }) => {
  const [connectedProviders, setConnectedProviders] = useState({});
  const [syncStatus, setSyncStatus] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({});
  const [cloudFiles, setCloudFiles] = useState({});
  const [syncSettings, setSyncSettings] = useState({
    autoSync: false,
    syncInterval: 3600000, // 1 hour
    syncOnWifi: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    compressImages: true,
    syncOriginals: false
  });

  // Cloud provider configurations
  const cloudProviders = {
    googleDrive: {
      name: 'Google Drive',
      icon: '📁',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      authUrl: 'https://accounts.google.com/oauth/authorize',
      clientId: 'YOUR_GOOGLE_CLIENT_ID',
      redirectUri: `${window.location.origin}/auth/google/callback`
    },
    oneDrive: {
      name: 'OneDrive',
      icon: '📂',
      scopes: ['Files.ReadWrite.AppFolder'],
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      clientId: 'YOUR_ONEDRIVE_CLIENT_ID',
      redirectUri: `${window.location.origin}/auth/onedrive/callback`
    },
    dropbox: {
      name: 'Dropbox',
      icon: '📦',
      scopes: ['files.content.write', 'files.content.read'],
      authUrl: 'https://www.dropbox.com/oauth2/authorize',
      clientId: 'YOUR_DROPBOX_APP_KEY',
      redirectUri: `${window.location.origin}/auth/dropbox/callback`
    },
    icloud: {
      name: 'iCloud',
      icon: '☁️',
      scopes: [],
      authUrl: null, // Uses system authentication
      clientId: null,
      redirectUri: null
    }
  };

  useEffect(() => {
    loadConnectedProviders();
    initializeSyncSettings();
    setupAutoSync();
  }, []);

  const loadConnectedProviders = async () => {
    try {
      const providers = await getConnectedProviders();
      setConnectedProviders(providers);
      
      // Load sync status for each provider
      const statusPromises = Object.keys(providers).map(async (providerId) => {
        const status = await getSyncStatus(providerId);
        return { [providerId]: status };
      });
      
      const statuses = await Promise.all(statusPromises);
      setSyncStatus(Object.assign({}, ...statuses));
      
    } catch (error) {
      console.error('Failed to load connected providers:', error);
      onError('Failed to load cloud providers');
    }
  };

  const initializeSyncSettings = async () => {
    try {
      const settings = await getSyncSettings();
      setSyncSettings(prev => ({ ...prev, ...settings }));
    } catch (error) {
      console.error('Failed to load sync settings:', error);
    }
  };

  const setupAutoSync = () => {
    if (syncSettings.autoSync) {
      const interval = setInterval(() => {
        if (navigator.onLine && (!syncSettings.syncOnWifi || isOnWifi())) {
          performAutoSync();
        }
      }, syncSettings.syncInterval);
      
      return () => clearInterval(interval);
    }
  };

  const connectProvider = async (providerId) => {
    try {
      const provider = cloudProviders[providerId];
      
      if (providerId === 'icloud') {
        // iCloud uses system authentication
        await connectToiCloud();
      } else {
        // OAuth flow for other providers
        const authUrl = buildAuthUrl(provider);
        const authCode = await openAuthPopup(authUrl);
        const tokens = await exchangeCodeForTokens(providerId, authCode);
        
        await saveProviderTokens(providerId, tokens);
      }
      
      // Update connected providers
      setConnectedProviders(prev => ({
        ...prev,
        [providerId]: { connected: true, lastSync: null }
      }));
      
      // Initialize sync status
      setSyncStatus(prev => ({
        ...prev,
        [providerId]: { lastSync: null, totalFiles: 0, syncedFiles: 0 }
      }));
      
      // Load cloud files
      await loadCloudFiles(providerId);
      
    } catch (error) {
      console.error(`Failed to connect to ${providerId}:`, error);
      onError(`Failed to connect to ${cloudProviders[providerId].name}`);
    }
  };

  const disconnectProvider = async (providerId) => {
    try {
      await revokeProviderTokens(providerId);
      
      setConnectedProviders(prev => {
        const newProviders = { ...prev };
        delete newProviders[providerId];
        return newProviders;
      });
      
      setSyncStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[providerId];
        return newStatus;
      });
      
      setCloudFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[providerId];
        return newFiles;
      });
      
    } catch (error) {
      console.error(`Failed to disconnect from ${providerId}:`, error);
      onError(`Failed to disconnect from ${cloudProviders[providerId].name}`);
    }
  };

  const syncToCloud = async (providerId, photoIds = null) => {
    try {
      setIsSyncing(true);
      setSyncProgress(prev => ({ ...prev, [providerId]: 0 }));
      
      const photosToSync = photoIds 
        ? photos.filter(photo => photoIds.includes(photo.id))
        : photos.filter(photo => needsSync(photo, providerId));
      
      const totalFiles = photosToSync.length;
      let syncedCount = 0;
      
      for (const photo of photosToSync) {
        try {
          await uploadPhotoToCloud(providerId, photo);
          syncedCount++;
          
          setSyncProgress(prev => ({
            ...prev,
            [providerId]: Math.round((syncedCount / totalFiles) * 100)
          }));
          
          // Update photo sync status
          await updatePhotoSyncStatus(photo.id, providerId, new Date().toISOString());
          
        } catch (error) {
          console.error(`Failed to sync photo ${photo.id}:`, error);
          // Continue with other photos
        }
      }
      
      // Update sync status
      setSyncStatus(prev => ({
        ...prev,
        [providerId]: {
          ...prev[providerId],
          lastSync: new Date().toISOString(),
          syncedFiles: (prev[providerId]?.syncedFiles || 0) + syncedCount,
          totalFiles: totalFiles
        }
      }));
      
      onSyncComplete(providerId, syncedCount, totalFiles);
      
    } catch (error) {
      console.error(`Sync failed for ${providerId}:`, error);
      onError(`Sync failed for ${cloudProviders[providerId].name}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[providerId];
        return newProgress;
      });
    }
  };

  const syncFromCloud = async (providerId) => {
    try {
      setIsSyncing(true);
      
      const cloudPhotos = await getCloudPhotos(providerId);
      const localPhotoIds = new Set(photos.map(photo => photo.id));
      
      let downloadedCount = 0;
      
      for (const cloudPhoto of cloudPhotos) {
        if (!localPhotoIds.has(cloudPhoto.id)) {
          try {
            await downloadPhotoFromCloud(providerId, cloudPhoto);
            downloadedCount++;
          } catch (error) {
            console.error(`Failed to download photo ${cloudPhoto.id}:`, error);
          }
        }
      }
      
      onSyncComplete(providerId, downloadedCount, cloudPhotos.length);
      
    } catch (error) {
      console.error(`Download sync failed for ${providerId}:`, error);
      onError(`Download failed for ${cloudProviders[providerId].name}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const biDirectionalSync = async (providerId) => {
    await syncToCloud(providerId);
    await syncFromCloud(providerId);
  };

  const uploadPhotoToCloud = async (providerId, photo) => {
    const fileData = await getPhotoFileData(photo);
    const metadata = generateCloudMetadata(photo);
    
    switch (providerId) {
      case 'googleDrive':
        return await uploadToGoogleDrive(fileData, metadata);
      case 'oneDrive':
        return await uploadToOneDrive(fileData, metadata);
      case 'dropbox':
        return await uploadToDropbox(fileData, metadata);
      case 'icloud':
        return await uploadToiCloud(fileData, metadata);
      default:
        throw new Error(`Unsupported provider: ${providerId}`);
    }
  };

  const downloadPhotoFromCloud = async (providerId, cloudPhoto) => {
    switch (providerId) {
      case 'googleDrive':
        return await downloadFromGoogleDrive(cloudPhoto.id);
      case 'oneDrive':
        return await downloadFromOneDrive(cloudPhoto.id);
      case 'dropbox':
        return await downloadFromDropbox(cloudPhoto.id);
      case 'icloud':
        return await downloadFromiCloud(cloudPhoto.id);
      default:
        throw new Error(`Unsupported provider: ${providerId}`);
    }
  };

  const getPhotoFileData = async (photo) => {
    if (syncSettings.compressImages) {
      return await compressPhoto(photo);
    }
    return photo.fileData;
  };

  const compressPhoto = async (photo) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (max 1920x1080)
        let { width, height } = img;
        const maxDimension = 1920;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };
      img.src = photo.url;
    });
  };

  const generateCloudMetadata = (photo) => {
    return {
      name: photo.name,
      description: photo.description,
      tags: photo.tags,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
      location: photo.location,
      metadata: photo.metadata,
      app: 'PicPocket',
      version: '1.0'
    };
  };

  const needsSync = (photo, providerId) => {
    const lastSync = photo.syncStatus?.[providerId];
    if (!lastSync) return true;
    
    const lastModified = new Date(photo.updatedAt);
    const syncTime = new Date(lastSync);
    
    return lastModified > syncTime;
  };

  const loadCloudFiles = async (providerId) => {
    try {
      const files = await getCloudFiles(providerId);
      setCloudFiles(prev => ({ ...prev, [providerId]: files }));
    } catch (error) {
      console.error(`Failed to load cloud files for ${providerId}:`, error);
    }
  };

  const updateSyncSettings = async (newSettings) => {
    try {
      setSyncSettings(newSettings);
      await saveSyncSettings(newSettings);
    } catch (error) {
      console.error('Failed to update sync settings:', error);
      onError('Failed to update sync settings');
    }
  };

  const isOnWifi = () => {
    // This is a simplified check - in reality, you'd use the Network Information API
    return navigator.connection?.type === 'wifi' || true; // Default to true
  };

  const performAutoSync = async () => {
    for (const providerId of Object.keys(connectedProviders)) {
      if (connectedProviders[providerId].connected) {
        await biDirectionalSync(providerId);
      }
    }
  };

  // Mock API functions
  const getConnectedProviders = async () => ({});
  const getSyncStatus = async (providerId) => ({ lastSync: null, totalFiles: 0, syncedFiles: 0 });
  const getSyncSettings = async () => syncSettings;
  const saveSyncSettings = async (settings) => console.log('Saving sync settings:', settings);
  const buildAuthUrl = (provider) => `${provider.authUrl}?client_id=${provider.clientId}&redirect_uri=${provider.redirectUri}&scope=${provider.scopes.join(' ')}&response_type=code`;
  const openAuthPopup = (url) => new Promise((resolve) => {
    const popup = window.open(url, 'auth', 'width=500,height=600');
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        resolve('mock_auth_code');
      }
    }, 1000);
  });
  const exchangeCodeForTokens = async (providerId, code) => ({ access_token: 'mock_token', refresh_token: 'mock_refresh' });
  const saveProviderTokens = async (providerId, tokens) => console.log(`Saving tokens for ${providerId}:`, tokens);
  const revokeProviderTokens = async (providerId) => console.log(`Revoking tokens for ${providerId}`);
  const getCloudFiles = async (providerId) => [];
  const getCloudPhotos = async (providerId) => [];
  const updatePhotoSyncStatus = async (photoId, providerId, timestamp) => console.log(`Updating sync status for ${photoId} on ${providerId}`);
  const connectToiCloud = async () => console.log('Connecting to iCloud');
  const uploadToGoogleDrive = async (data, metadata) => console.log('Uploading to Google Drive');
  const uploadToOneDrive = async (data, metadata) => console.log('Uploading to OneDrive');
  const uploadToDropbox = async (data, metadata) => console.log('Uploading to Dropbox');
  const uploadToiCloud = async (data, metadata) => console.log('Uploading to iCloud');
  const downloadFromGoogleDrive = async (fileId) => console.log('Downloading from Google Drive');
  const downloadFromOneDrive = async (fileId) => console.log('Downloading from OneDrive');
  const downloadFromDropbox = async (fileId) => console.log('Downloading from Dropbox');
  const downloadFromiCloud = async (fileId) => console.log('Downloading from iCloud');

  return (
    <div className="cloud-sync">
      <div className="cloud-sync-header">
        <h2>Cloud Sync</h2>
        <div className="sync-controls">
          <button 
            onClick={performAutoSync}
            disabled={isSyncing || Object.keys(connectedProviders).length === 0}
            className="sync-all-btn"
          >
            {isSyncing ? 'Syncing...' : 'Sync All'}
          </button>
          <button 
            onClick={() => {/* Open settings */}}
            className="settings-btn"
          >
            ⚙️
          </button>
        </div>
      </div>

      <div className="providers-grid">
        {Object.entries(cloudProviders).map(([providerId, provider]) => {
          const isConnected = connectedProviders[providerId]?.connected;
          const status = syncStatus[providerId] || {};
          const progress = syncProgress[providerId];
          
          return (
            <div key={providerId} className={`provider-card ${isConnected ? 'connected' : ''}`}>
              <div className="provider-header">
                <div className="provider-info">
                  <span className="provider-icon">{provider.icon}</span>
                  <div>
                    <h3>{provider.name}</h3>
                    <p className="provider-status">
                      {isConnected ? `Connected • ${status.syncedFiles || 0} files synced` : 'Not connected'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => isConnected ? disconnectProvider(providerId) : connectProvider(providerId)}
                  className={`provider-toggle ${isConnected ? 'disconnect' : 'connect'}`}
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>

              {isConnected && (
                <div className="provider-details">
                  {status.lastSync && (
                    <p className="last-sync">Last sync: {new Date(status.lastSync).toLocaleString()}</p>
                  )}
                  
                  {progress !== undefined && (
                    <div className="sync-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{progress}%</span>
                    </div>
                  )}
                  
                  <div className="provider-actions">
                    <button 
                      onClick={() => syncToCloud(providerId)}
                      disabled={isSyncing}
                      className="action-btn"
                    >
                      Upload
                    </button>
                    <button 
                      onClick={() => syncFromCloud(providerId)}
                      disabled={isSyncing}
                      className="action-btn"
                    >
                      Download
                    </button>
                    <button 
                      onClick={() => biDirectionalSync(providerId)}
                      disabled={isSyncing}
                      className="action-btn primary"
                    >
                      Sync Both Ways
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sync Settings Modal */}
      <div className="sync-settings">
        <h3>Sync Settings</h3>
        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={syncSettings.autoSync}
              onChange={(e) => updateSyncSettings({ ...syncSettings, autoSync: e.target.checked })}
            />
            Auto-sync
          </label>
        </div>
        
        <div className="setting-group">
          <label>Sync Interval</label>
          <select
            value={syncSettings.syncInterval}
            onChange={(e) => updateSyncSettings({ ...syncSettings, syncInterval: parseInt(e.target.value) })}
          >
            <option value={900000}>15 minutes</option>
            <option value={3600000}>1 hour</option>
            <option value={21600000}>6 hours</option>
            <option value={86400000}>24 hours</option>
          </select>
        </div>
        
        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={syncSettings.syncOnWifi}
              onChange={(e) => updateSyncSettings({ ...syncSettings, syncOnWifi: e.target.checked })}
            />
            Only sync on Wi-Fi
          </label>
        </div>
        
        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={syncSettings.compressImages}
              onChange={(e) => updateSyncSettings({ ...syncSettings, compressImages: e.target.checked })}
            />
            Compress images
          </label>
        </div>
        
        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={syncSettings.syncOriginals}
              onChange={(e) => updateSyncSettings({ ...syncSettings, syncOriginals: e.target.checked })}
            />
            Sync original files
          </label>
        </div>
      </div>
    </div>
  );
};

export default CloudSync;