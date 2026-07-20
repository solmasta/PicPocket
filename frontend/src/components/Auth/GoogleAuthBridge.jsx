import { useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/photoslibrary',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

// Renders nothing. Only ever mounted (by App) when a Google Client ID is
// configured, so it's always inside a GoogleOAuthProvider and it's safe to
// call useGoogleLogin unconditionally here.
function GoogleAuthBridge({ onSuccess, onError, onReady }) {
  const googleLogin = useGoogleLogin({
    onSuccess,
    onError,
    scope: GOOGLE_SCOPES,
  });

  useEffect(() => {
    onReady(() => googleLogin);
  }, [googleLogin, onReady]);

  return null;
}

export default GoogleAuthBridge;
