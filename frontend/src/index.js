import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles/index.css';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import { getGoogleClientId, isGoogleAuthConfigured } from './config/googleAuth';

// Google sign-in is optional — PicPals' core photo storage runs on
// IndexedDB and needs no server or Google account. Only mount
// GoogleOAuthProvider when a Client ID is actually configured, so a
// missing/blank Client ID can never crash the app; it just means Google
// sign-in isn't offered.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {isGoogleAuthConfigured() ? (
        <GoogleOAuthProvider clientId={getGoogleClientId()}>
          <App />
        </GoogleOAuthProvider>
      ) : (
        <App />
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
