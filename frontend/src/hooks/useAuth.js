import { useState, useEffect, useCallback, useRef } from 'react';
import { saveAuthUser, getAuthUser, clearAuthUser } from '../utils/indexedDB';
import { isGoogleAuthConfigured } from '../config/googleAuth';

// Start trying to renew the access token this far ahead of its actual
// expiry, so a silent renewal has time to land before anything notices.
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
// How long to wait for a silent (no-UI) renewal attempt before giving up
// and surfacing the "Reconnect" button instead.
const SILENT_RECONNECT_TIMEOUT_MS = 4000;

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
  // Tracks whether the in-flight Google request is a background silent
  // renewal (vs. an explicit click), so a failed silent attempt can stay
  // quiet instead of showing the user a "sign-in failed" error.
  const silentAttemptRef = useRef(false);

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
          // The renewal effect below checks expiry (and attempts a silent
          // renewal) as soon as `user` is set, so it isn't computed here —
          // just restore the identity.
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

  // Keep the session alive without ever prompting: a little before the
  // access token is due to expire, ask Google for a fresh one with no UI
  // (prompt: ''), which succeeds silently as long as the browser still has
  // an active Google session — no backend, no popup, no click required.
  // Only if that doesn't resolve in time does the "Reconnect" button show
  // up, as a one-tap fallback (e.g. the user signed out of Google
  // elsewhere, or the browser blocks the silent request).
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

  // Called by <GoogleAuthBridge> once useGoogleLogin is ready.
  // getLogin is a zero-arg factory that returns the current googleLogin fn.
  const registerGoogleLogin = useCallback((getLogin) => {
    googleLoginRef.current = getLogin;
  }, []);

  const handleLoginSuccess = useCallback(async (tokenResponse) => {
    try {
      setError(null);
      // Fetch user profile using the access token
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
      setUser(userData);
      setTokenExpired(false);
      silentAttemptRef.current = false;
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
    }
  }, []);

  const handleLoginError = useCallback((err) => {
    if (silentAttemptRef.current) {
      // A background renewal attempt failing is expected sometimes (no
      // active Google session, third-party cookies blocked, etc.) — the
      // "Reconnect" fallback covers it, so don't alarm the user over it.
      silentAttemptRef.current = false;
      console.warn('Silent Google reconnect failed:', err);
      return;
    }
    setError('Google sign-in failed. Please try again.');
    console.error('Google OAuth error:', err);
  }, []);

  const signIn = useCallback(() => {
    setError(null);
    silentAttemptRef.current = false;
    if (googleLoginRef.current) {
      googleLoginRef.current()();
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (user?.accessToken) {
        // Best-effort: tell Google to revoke the grant so Drive/Photos
        // access actually ends here, instead of the access token (and the
        // silent-renewal flow above) remaining usable until it happens to
        // expire on its own after "signing out".
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
      setUser(null);
      setTokenExpired(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }, [user]);

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
