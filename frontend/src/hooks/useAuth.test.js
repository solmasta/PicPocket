import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { saveAuthUser, getAuthUser, clearAuthUser } from '../utils/indexedDB';

jest.mock('../utils/indexedDB');
jest.mock('../config/googleAuth', () => ({
  isGoogleAuthConfigured: () => true,
}));

describe('useAuth signOut', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAuthUser.mockResolvedValue(null);
    clearAuthUser.mockResolvedValue(undefined);
    saveAuthUser.mockResolvedValue(undefined);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        picture: null,
      }),
    });
  });

  test('revokes the Google access token and clears local state', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleLoginSuccess({
        access_token: 'test-access-token',
        expires_in: 3600,
        scope: 'openid profile email',
      });
    });

    global.fetch.mockClear();

    await act(async () => {
      await result.current.signOut();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/revoke?token=test-access-token',
      { method: 'POST' }
    );
    expect(clearAuthUser).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  test('does not call the revoke endpoint when there is no access token', async () => {
    getAuthUser.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      isLocal: false,
    });
    const { result } = renderHook(() => useAuth());

    // Wait for the mount effect to restore the session before signing out
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(clearAuthUser).toHaveBeenCalled();
  });

  test('signing out of a local session clears the persisted local choice too', async () => {
    getAuthUser.mockResolvedValue({ id: 'local-user', isLocal: true, name: 'You' });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(clearAuthUser).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});

describe('useAuth continueLocally', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAuthUser.mockResolvedValue(null);
    saveAuthUser.mockResolvedValue(undefined);
  });

  test('persists and adopts the local-only identity, independent of any Google session', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.current.user).toBeNull(); // Google configured, nothing saved yet

    await act(async () => {
      await result.current.continueLocally();
    });

    expect(saveAuthUser).toHaveBeenCalledWith(expect.objectContaining({ id: 'local-user', isLocal: true }));
    expect(result.current.user).toEqual(expect.objectContaining({ id: 'local-user', isLocal: true }));
  });

  test('a signed-in Google user can drop back to local-only without an error', async () => {
    getAuthUser.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      isLocal: false,
      accessToken: 'tok',
    });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.continueLocally();
    });

    expect(result.current.user.isLocal).toBe(true);
  });
});
