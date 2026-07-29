import { useState, useEffect, useCallback, useRef } from 'react';
import { saveAuthUser, getAuthUser, clearAuthUser } from '../utils/indexedDB';
import { isGoogleAuthConfigured } from '../config/googleAuth';
import { exchangeGoogleCode, refreshGoogleAccessToken } from '../services/authService';

// Renew the access token this far ahead of its actual expiry, so a silent
// refresh has already happened by the time anything would notice it lapsed.
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

// Anonymous, device-local identity used when the person hasn't signed in
// with Google (or Google sign-in isn't configured at all). Photo storage,
// gallery, filters, etc. all key off `user.id`, so this just needs to be
// stable for the lifetime of this browser's IndexedDB.
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
  // Holds the trigger function returned by @react-oauth/google's
  // useGoogleLogin, supplied by <GoogleAuthBridge> via registerGoogleLogin.
  const googleLoginRef = useRef(null);

  // Restore session from IndexedDB on mount. The signed-in identity is kept
  // even once its Google access token has expired — the token is only ever
  // needed for Drive/Photos backup calls, not for using the app itself, so
  // reopening the app (including after the browser's pull-to-refresh reload)
  // should never boot someone back to the sign-in screen.
  useEffect(() => {
    async function restoreSession() {
      try {
        if (!isGoogleAuthConfigured()) {
          // No Google Client ID — use a stable local identity so the rest
          // of the app (gallery, upload, filters…) works without sign-in.
          setUser(LOCAL_USER);
          return;
        }
        const savedUser = await getAuthUser();
        if (savedUser) {
          // The token-refresh effect below checks expiry (and attempts a
          // silent refresh) as soon as `user` is set, so it isn't computed
          // here — just restore the identity.
          setUser(savedUser);
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Silently exchanges a stored refresh token for a fresh access token.
  // Returns true on success. Users who signed in before refresh tokens were
  // captured (or whose refresh token Google has since revoked) have no
  // refreshToken to use here — they fall back to the "Reconnect" button.
  const refreshAccessToken = useCallback(async (currentUser) => {
    if (!currentUser?.refreshToken) return false;
    try {
      const data = await refreshGoogleAccessToken(currentUser.refreshToken);
      const updated = {
        ...currentUser,
        accessToken: data.accessToken,
        expiresAt: Date.now() + data.expiresIn * 1000,
      };
      await saveAuthUser(updated);
      setUser(updated);
      setTokenExpired(false);
      return true;
    } catch (err) {
      console.warn('Silent token refresh failed:', err.message);
      return false;
    }
  }, []);

  // Keep the access token fresh for as long as the app stays open: check a
  // little before it's due to expire and renew it silently. Only falls back
  // to surfacing the "Reconnect" affordance if there's no refresh token to
  // use, or Google rejects it (e.g. revoked access).
  useEffect(() => {
    if (!user || !user.expiresAt) return undefined;

    let cancelled = false;
    const tick = async () => {
      const dueForRefresh = Date.now() >= user.expiresAt - REFRESH_MARGIN_MS;
      if (!dueForRefresh) {
        setTokenExpired(false);
        return;
      }
      const refreshed = await refreshAccessToken(user);
      if (!cancelled && !refreshed) {
        setTokenExpired(Date.now() >= user.expiresAt);
      }
    };

    tick();
    const interval = setInterval(tick, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, refreshAccessToken]);

  // Called by <GoogleAuthBridge> once useGoogleLogin is ready.
  // getLogin is a zero-arg factory that returns the current googleLogin fn.
  const registerGoogleLogin = useCallback((getLogin) => {
    googleLoginRef.current = getLogin;
  }, []);

  const handleLoginSuccess = useCallback(async (codeResponse) => {
    try {
      setError(null);
      // Exchange the one-time authorization code server-side (the Google
      // client secret this needs can't live in the frontend) for an access
      // token plus a refresh token, so the session can renew itself later
      // without ever showing the user another sign-in prompt.
      const data = await exchangeGoogleCode(codeResponse.code);

      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        picture: data.user.picture,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + data.expiresIn * 1000,
        scope: codeResponse.scope,
      };

      await saveAuthUser(userData);
      setUser(userData);
      setTokenExpired(false);
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
    }
  }, []);

  const handleLoginError = useCallback((err) => {
    setError('Google sign-in failed. Please try again.');
    console.error('Google OAuth error:', err);
  }, []);

  const signIn = useCallback(() => {
    setError(null);
    if (googleLoginRef.current) {
      googleLoginRef.current()();
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await clearAuthUser();
      setUser(null);
      setTokenExpired(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }, []);

  return {
    user,
    loading,
    error,
    tokenExpired,
    signIn,
    signOut,
    registerGoogleLogin,
    handleLoginSuccess,
    handleLoginError,
  };
}
