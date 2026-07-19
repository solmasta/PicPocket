import { useState, useEffect, useCallback } from 'react';
import {
  configureGoogleSignIn,
  signIn,
  signOut,
  revokeAccess,
  getCurrentUser,
} from '../Services/authService';

/**
 * useAuth
 *
 * React hook that manages Google authentication state and exposes
 * sign-in / sign-out / revoke actions for use in components.
 *
 * @param {object}  [options]
 * @param {string}  [options.webClientId] - OAuth 2.0 Web client ID.
 *   Pass this the first time the hook is used (e.g. in the root component).
 *   Subsequent usages without an id will reuse the existing configuration.
 * @returns {{
 *   user: object|null,
 *   isLoading: boolean,
 *   isSignedIn: boolean,
 *   error: string|null,
 *   handleSignIn: () => Promise<void>,
 *   handleSignOut: () => Promise<void>,
 *   handleRevokeAccess: () => Promise<void>,
 * }}
 */
const useAuth = ({ webClientId } = {}) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure Google Sign-In once when a webClientId is provided
  useEffect(() => {
    if (webClientId) {
      configureGoogleSignIn(webClientId);
    }
  }, [webClientId]);

  // Restore session on mount
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { user: signedInUser } = await signIn();
      setUser(signedInUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRevokeAccess = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await revokeAccess();
      setUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    isSignedIn: user !== null,
    error,
    handleSignIn,
    handleSignOut,
    handleRevokeAccess,
  };
};

export default useAuth;
