import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Auth from './components/Auth';
import PhotoGallery from './components/PhotoGallery';
import HorseProfile from './components/HorseProfile';
import Settings from './components/Settings';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <div className="app">
          {!user ? (
            <Auth onLogin={handleLogin} />
          ) : (
            <Routes>
              <Route path="/" element={<PhotoGallery user={user} />} />
              <Route path="/horses/:id" element={<HorseProfile user={user} />} />
              <Route path="/settings" element={<Settings user={user} onLogout={handleLogout} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
