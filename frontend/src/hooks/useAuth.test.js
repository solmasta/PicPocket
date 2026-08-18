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
});
