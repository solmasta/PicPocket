import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { saveAuthUser, getAuthUser, clearAuthUser } from '../utils/indexedDB';
import { isGoogleAuthConfigured } from '../config/googleAuth';
import { withErrorHandling, ErrorCodes, logError } from '../utils/errorHandler';

const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const SILENT_RECONNECT_TIMEOUT_MS = 4000;

const LOCAL_USER = {
  id: 'local-user',
  isLocal: true,
  name: 'You',
  email: null,
  picture: null,
};

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const googleLoginRef = useRef(null);
  const silentAttemptRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
        if (!isGoogleAuthConfigured()) {
          setUser(LOCAL_USER);
          setLoading(false);
          return;
        }
        const savedUser = await getAuthUser();
        if (!cancelled) {
          if (savedUser) {
            setUser(savedUser);
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        logError('useAuth.restoreSession', err);
        if (!cancelled) setError('Failed to restore session');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || !user.expiresAt) return undefined;

    let cancelled = false;
    let fallbackTimer = null;

    const tick = () => {
      const dueForRefresh = Date.now() >= user.expiresAt - REFRESH_MARGIN_MS;
      if (!dueForRefresh) {
        setTokenExpired(false);
        return;
      }
      if (!googleLoginRef.current) {
        setTokenExpired(true);
        return;
      }

      silentAttemptRef.current = true;
      googleLoginRef.current()({ prompt: '' });

      fallbackTimer = setTimeout(() => {
        if (!cancelled) setTokenExpired(Date.now() >= user.expiresAt);
      }, SILENT_RECONNECT_TIMEOUT_MS);
    };

    tick();
    const interval = setInterval(tick, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [user]);

  const registerGoogleLogin = useCallback((getLogin) => {
    googleLoginRef.current = getLogin;
  }, []);

  const handleLoginSuccess = useCallback(async (tokenResponse) => {
    const { data, error: err } = await withErrorHandling(
      (async () => {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: 'Bearer ' + tokenResponse.access_token },
        });

        if (!profileRes.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const profile = await profileRes.json();
        const userData = {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
          accessToken: tokenResponse.access_token,
          expiresAt: Date.now() + (tokenResponse.expires_in || 3600) * 1000,
          scope: tokenResponse.scope,
        };

        await saveAuthUser(userData);
        return userData;
      })(),
      'Failed to complete sign-in'
    );

    if (err) {
      setError(err.message);
      logError('useAuth.handleLoginSuccess', err);
      return;
    }

    setUser(data);
    setTokenExpired(false);
    silentAttemptRef.current = false;
  }, []);

  const handleLoginError = useCallback((err) => {
    if (silentAttemptRef.current) {
      silentAttemptRef.current = false;
      console.warn('Silent Google reconnect failed:', err);
      return;
    }
    setError('Google sign-in failed. Please try again.');
    logError('useAuth.handleLoginError', err);
  }, []);

  const signIn = useCallback(() => {
    setError(null);
    silentAttemptRef.current = false;
    if (googleLoginRef.current) {
      googleLoginRef.current()();
    }
  }, []);

  const continueLocally = useCallback(async () => {
    const { error: err } = await withErrorHandling(
      saveAuthUser(LOCAL_USER),
      'Failed to save local session'
    );
    if (err) {
      logError('useAuth.continueLocally', err);
    }
    setUser(LOCAL_USER);
    setError(null);
    setTokenExpired(false);
  }, []);

  const signOut = useCallback(async () => {
    const { error: err } = await withErrorHandling(
      (async () => {
        if (user && !user.isLocal) {
          if (user.accessToken) {
            try {
              await fetch(
                `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(user.accessToken)}`,
                { method: 'POST' }
              );
            } catch (revokeErr) {
              console.warn('Failed to revoke Google token:', revokeErr);
            }
          }
          await clearAuthUser();
        } else if (user && user.isLocal) {
          await clearAuthUser();
        }
      })(),
      'Failed to sign out'
    );

    if (err) {
      logError('useAuth.signOut', err);
    }

    setUser(null);
    setTokenExpired(false);
  }, [user]);

  const clearAuthError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    tokenExpired,
    signIn,
    signOut,
    continueLocally,
    registerGoogleLogin,
    handleLoginSuccess,
    handleLoginError,
    clearAuthError,
    isAuthenticated: Boolean(user),
    isLocalUser: user?.isLocal ?? false,
  }), [user, loading, error, tokenExpired, signIn, signOut, continueLocally, registerGoogleLogin, handleLoginSuccess, handleLoginError, clearAuthError]);

  return value;
}

export { LOCAL_USER };
export default useAuth;