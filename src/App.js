import React, { useState } from 'react';
import Auth from './components/Auth';
import PhotoGallery from './components/PhotoGallery';

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleSignIn = (email) => {
    setUserEmail(email);
    setIsSignedIn(true);
  };

  const handleSignOut = () => {
    setUserEmail('');
    setIsSignedIn(false);
  };

  return isSignedIn ? (
    <PhotoGallery userEmail={userEmail} onSignOut={handleSignOut} />
  ) : (
    <Auth onSignIn={handleSignIn} />
  );
}

export default App;
