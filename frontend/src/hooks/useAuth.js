import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { saveAuthUser, getAuthUser, clearAuthUser } from '../utils/indexedDB';

const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/photoslibrary',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session from IndexedDB on mount
  useEffect(() => {
    async function restoreSession() {
      try {
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

  const googleLogin = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: (err) => {
      setError('Google sign-in failed. Please try again.');
      console.error('Google OAuth error:', err);
    },
    scope: GOOGLE_SCOPES,
  });

  const signIn = useCallback(() => {
    setError(null);
    googleLogin();
  }, [googleLogin]);

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

  return { user, loading, error, signIn, signOut, refreshToken };
}
