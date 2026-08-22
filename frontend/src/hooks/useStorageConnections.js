import { useState, useEffect, useCallback, useMemo } from 'react';
import { saveConnection, getConnection, clearConnection } from '../utils/indexedDB';
import { isOneDriveConfigured, getOneDriveClientId } from '../config/oneDriveAuth';
import { isDropboxConfigured, getDropboxClientId } from '../config/dropboxAuth';
import { connectOneDrive as runOneDriveOAuth } from '../services/oneDriveAuthService';
import { connectDropbox as runDropboxOAuth } from '../services/dropboxAuthService';
import { withErrorHandling, ErrorCodes } from '../utils/errorHandler';

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

export function useStorageConnections() {
  const [connections, setConnections] = useState({ onedrive: null, dropbox: null });
  const [connecting, setConnecting] = useState(null);
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
    if (!config) {
      setErrors((prev) => ({ ...prev, [provider]: 'Unknown provider' }));
      return { data: null, error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Unknown provider' } };
    }

    setErrors((prev) => ({ ...prev, [provider]: null }));
    setConnecting(provider);

    const { data, error } = await withErrorHandling(
      (async () => {
        const clientId = config.getClientId();
        const result = await config.runOAuth(clientId);
        await saveConnection(provider, result);
        setConnections((prev) => ({ ...prev, [provider]: result }));
        return result;
      })(),
      `Failed to connect ${config.label}`
    );

    if (error) {
      setErrors((prev) => ({ ...prev, [provider]: error.message }));
    }

    setConnecting(null);
    return { data, error };
  }, []);

  const disconnect = useCallback(async (provider) => {
    const { data, error } = await withErrorHandling(
      (async () => {
        await clearConnection(provider);
        setConnections((prev) => ({ ...prev, [provider]: null }));
        return { provider };
      })(),
      `Failed to disconnect ${PROVIDERS[provider]?.label || provider}`
    );
    return { data, error };
  }, []);

  const isConnected = useCallback((provider) => {
    return Boolean(connections[provider]);
  }, [connections]);

  const clearError = useCallback((provider) => {
    setErrors((prev) => ({ ...prev, [provider]: null }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const value = useMemo(() => ({
    connections,
    connecting,
    errors,
    connect,
    disconnect,
    isConnected,
    clearError,
    clearAllErrors,
    isOneDriveConfigured: isOneDriveConfigured(),
    isDropboxConfigured: isDropboxConfigured(),
  }), [connections, connecting, errors, connect, disconnect, isConnected, clearError, clearAllErrors]);

  return value;
}