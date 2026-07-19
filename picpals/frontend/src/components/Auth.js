import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { loginWithGoogle } from '../services/googleAuth';

function Auth({ onLogin }) {
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userData = await loginWithGoogle(tokenResponse.access_token);
        onLogin(userData);
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
    },
    scope: 'openid email profile https://www.googleapis.com/auth/photoslibrary.readonly https://www.googleapis.com/auth/drive.file',
  });

  return (
    <div className="auth-container">
      <h1>PicPals</h1>
      <p>Your photo memories, beautifully organized.</p>
      <button onClick={() => googleLogin()} className="google-login-btn">
        Sign in with Google
      </button>
    </div>
  );
}

export default Auth;
