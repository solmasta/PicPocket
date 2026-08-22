import { useCallback, useMemo } from 'react';
import { useStorage } from '../context/StorageContext';
import { withErrorHandling, ErrorCodes } from '../utils/errorHandler';

export function useStorageConnections() {
  const {
    connectedServices,
    loading,
    error,
    lastSync,
    connectService,
    disconnectService,
    clearError
  } = useStorage();

  const isConnected = useCallback((service) => {
    return connectedServices.includes(service);
  }, [connectedServices]);

  const connect = useCallback(async (service, credentials) => {
    const { data, error: err } = await withErrorHandling(
      (async () => {
        if (!service) {
          throw new Error('Service name is required');
        }
        await connectService(service);
        return { service, connectedAt: new Date().toISOString() };
      })(),
      'Failed to connect to storage service'
    );
    return { data, error: err };
  }, [connectService]);

  const disconnect = useCallback((service) => {
    if (!service) {
      return { data: null, error: { message: 'Service name is required', code: ErrorCodes.VALIDATION_ERROR } };
    }
    disconnectService(service);
    return { data: { service, disconnectedAt: new Date().toISOString() }, error: null };
  }, [disconnectService]);

  const value = useMemo(() => ({
    connectedServices,
    isConnected,
    connect,
    disconnect,
    loading,
    error,
    lastSync,
    clearError
  }), [connectedServices, isConnected, connect, disconnect, loading, error, lastSync, clearError]);

  return value;
}

export function useStorageQuota() {
  const { storageQuota, usedStorage, setQuota, updateStorageUsage } = useStorage();

  const usagePercentage = useMemo(() => {
    if (!storageQuota || storageQuota === 0) return 0;
    return Math.round((usedStorage / storageQuota) * 100);
  }, [storageQuota, usedStorage]);

  const availableStorage = useMemo(() => {
    if (!storageQuota) return null;
    return Math.max(0, storageQuota - usedStorage);
  }, [storageQuota, usedStorage]);

  const formatStorageSize = useCallback((bytes) => {
    if (bytes === null || bytes === undefined) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }, []);

  const isNearQuota = useMemo(() => {
    return usagePercentage >= 80;
  }, [usagePercentage]);

  const isOverQuota = useMemo(() => {
    return usagePercentage >= 100;
  }, [usagePercentage]);

  return {
    storageQuota,
    usedStorage,
    usagePercentage,
    availableStorage,
    formatStorageSize,
    isNearQuota,
    isOverQuota,
    setQuota,
    updateStorageUsage
  };
}

export default useStorageConnections;