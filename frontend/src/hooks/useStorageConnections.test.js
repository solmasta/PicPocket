import { renderHook, act } from '@testing-library/react';
import { useStorageConnections } from './useStorageConnections';
import { saveConnection, getConnection, clearConnection } from '../utils/indexedDB';
import { connectOneDrive } from '../services/oneDriveAuthService';
import { connectDropbox } from '../services/dropboxAuthService';

jest.mock('../utils/indexedDB');
jest.mock('../services/oneDriveAuthService');
jest.mock('../services/dropboxAuthService');
jest.mock('../config/oneDriveAuth', () => ({
  isOneDriveConfigured: () => true,
  getOneDriveClientId: () => 'fake-onedrive-client-id',
}));
jest.mock('../config/dropboxAuth', () => ({
  isDropboxConfigured: () => true,
  getDropboxClientId: () => 'fake-dropbox-client-id',
}));

describe('useStorageConnections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getConnection.mockResolvedValue(undefined);
    saveConnection.mockResolvedValue(undefined);
    clearConnection.mockResolvedValue(undefined);
  });

  test('connect() runs the OAuth flow, persists, and exposes the result', async () => {
    connectOneDrive.mockResolvedValue({
      accessToken: 'od-token',
      accountName: 'Daughter OneDrive',
      accountEmail: 'daughter@outlook.com',
      expiresAt: Date.now() + 3600000,
    });

    const { result } = renderHook(() => useStorageConnections());

    await act(async () => {
      await result.current.connect('onedrive');
    });

    expect(connectOneDrive).toHaveBeenCalledWith('fake-onedrive-client-id');
    expect(saveConnection).toHaveBeenCalledWith('onedrive', expect.objectContaining({ accessToken: 'od-token' }));
    expect(result.current.connections.onedrive.accountName).toBe('Daughter OneDrive');
    expect(result.current.connecting).toBeNull();
  });

  test('a failed OAuth attempt surfaces an error and does not persist a connection', async () => {
    connectDropbox.mockRejectedValue(new Error('Popup blocked.'));

    const { result } = renderHook(() => useStorageConnections());

    await act(async () => {
      await result.current.connect('dropbox');
    });

    expect(result.current.errors.dropbox).toBe('Popup blocked.');
    expect(result.current.connections.dropbox).toBeNull();
    expect(saveConnection).not.toHaveBeenCalled();
  });

  test('disconnect() clears the stored connection', async () => {
    getConnection.mockImplementation((provider) =>
      provider === 'onedrive' ? { accessToken: 'od-token', accountName: 'Daughter OneDrive' } : undefined
    );

    const { result } = renderHook(() => useStorageConnections());

    // wait for the initial restore effect to apply the mocked connection
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.connections.onedrive).not.toBeNull();

    await act(async () => {
      await result.current.disconnect('onedrive');
    });

    expect(clearConnection).toHaveBeenCalledWith('onedrive');
    expect(result.current.connections.onedrive).toBeNull();
  });
});
