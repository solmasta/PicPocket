import { useState, useEffect, useCallback } from 'react';
import { saveConnection, getConnection, clearConnection } from '../utils/indexedDB';
import { isOneDriveConfigured, getOneDriveClientId } from '../config/oneDriveAuth';
import { isDropboxConfigured, getDropboxClientId } from '../config/dropboxAuth';
import { connectOneDrive as runOneDriveOAuth } from '../services/oneDriveAuthService';
import { connectDropbox as runDropboxOAuth } from '../services/dropboxAuthService';

const PROVIDERS = {
  onedrive: {
    isConfigured: isOneDriveConfigured,
    getClientId: getOneDriveClientId,
    runOAuth: runOneDriveOAuth,
    label: 'OneDrive',
  },
  dropbox: {
    isConfigured: isDropboxConfigured,
    getClientId: getDropboxClientId,
    runOAuth: runDropboxOAuth,
    label: 'Dropbox',
  },
};

// Manages optional third-party storage connections (OneDrive, Dropbox, ...)
// as backup destinations alongside Google Drive/Photos. These are
// independent of the app's sign-in identity — a local (non-Google) user can
// still connect OneDrive/Dropbox for backup, and a Google-signed-in user can
// have all four connected at once.
export function useStorageConnections() {
  const [connections, setConnections] = useState({ onedrive: null, dropbox: null });
  const [connecting, setConnecting] = useState(null); // which provider is mid-OAuth, if any
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        const entries = await Promise.all(
          Object.keys(PROVIDERS).map(async (provider) => [provider, await getConnection(provider)])
        );
        if (cancelled) return;
        setConnections((prev) => {
          const next = { ...prev };
          for (const [provider, data] of entries) {
            if (data) next[provider] = data;
          }
          return next;
        });
      } catch (err) {
        console.error('Failed to restore storage connections:', err);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async (provider) => {
    const config = PROVIDERS[provider];
    if (!config) return;

    setErrors((prev) => ({ ...prev, [provider]: null }));
    setConnecting(provider);
    try {
      const clientId = config.getClientId();
      const result = await config.runOAuth(clientId);
      await saveConnection(provider, result);
      setConnections((prev) => ({ ...prev, [provider]: result }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, [provider]: err.message || `Failed to connect ${config.label}.` }));
    } finally {
      setConnecting(null);
    }
  }, []);

  const disconnect = useCallback(async (provider) => {
    try {
      await clearConnection(provider);
      setConnections((prev) => ({ ...prev, [provider]: null }));
    } catch (err) {
      console.error(`Failed to disconnect ${provider}:`, err);
    }
  }, []);

  return {
    connections, // { onedrive: {accessToken, accountName, accountEmail, expiresAt} | null, dropbox: ... }
    connecting,
    errors,
    connect,
    disconnect,
    isOneDriveConfigured: isOneDriveConfigured(),
    isDropboxConfigured: isDropboxConfigured(),
  };
}
