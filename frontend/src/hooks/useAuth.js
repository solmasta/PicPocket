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
  // Holds the trigger function returned by @react-oauth/google's
  // useGoogleLogin, supplied by <GoogleAuthBridge> via registerGoogleLogin.
  const googleLoginRef = useRef(null);

  // Restore session from IndexedDB on mount
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
          // Check if access token is still valid (rough check)
          if (savedUser.expiresAt && Date.now() < savedUser.expiresAt) {
            setUser(savedUser);
          } else {
            await clearAuthUser();
          }
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

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
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    // Token refresh would require server-side implementation with refresh tokens
    // For now, prompt re-login when token expires
    if (user && user.expiresAt && Date.now() >= user.expiresAt) {
      await signOut();
    }
  }, [user, signOut]);

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    refreshToken,
    registerGoogleLogin,
    handleLoginSuccess,
    handleLoginError,
  };
}
