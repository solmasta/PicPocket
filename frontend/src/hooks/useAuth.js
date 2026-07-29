import { useState, useEffect, useCallback, useRef } from 'react';
import { saveAuthUser, getAuthUser, clearAuthUser } from '../utils/indexedDB';
import { isGoogleAuthConfigured } from '../config/googleAuth';

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
          setUser(savedUser);
          setTokenExpired(Boolean(savedUser.expiresAt && Date.now() >= savedUser.expiresAt));
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Re-check expiry periodically so a long-open tab surfaces the "Reconnect"
  // affordance once its token lapses, instead of only checking on mount.
  useEffect(() => {
    if (!user || !user.expiresAt) return undefined;
    const check = () => setTokenExpired(Date.now() >= user.expiresAt);
    check();
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
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
