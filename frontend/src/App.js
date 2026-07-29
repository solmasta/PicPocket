import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/App.css';
import backgroundImage from './assets/faye-pic-pocket.jpg';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import GoogleSignIn from './components/Auth/GoogleSignIn';
import GoogleAuthBridge from './components/Auth/GoogleAuthBridge';
import Splash from './components/Splash/Splash';
import PhotoGallery from './components/Gallery/PhotoGallery';
import PhotoUpload from './components/Upload/PhotoUpload';
import TagSearch from './components/Tags/TagSearch';
import PhotoFilters from './components/Filters/PhotoFilters';
import CollageMaker from './components/Collage/CollageMaker';
import PhotoStories from './components/Stories/PhotoStories';
import PhotoSlideshow from './components/Slideshow/PhotoSlideshow';
import MemoryLane from './components/MemoryLane/MemoryLane';
import AlbumSharing from './components/Sharing/AlbumSharing';
import SharedAlbumView from './components/Sharing/SharedAlbumView';
import HorseProfile from './components/HorseProfile';
import Settings from './components/Settings/Settings';
import { useAuth } from './hooks/useAuth';
import { usePhotos } from './hooks/usePhotos';
import { isGoogleAuthConfigured } from './config/googleAuth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/album/:token" element={<SharedAlbumView />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}

function MainApp() {
  const {
    user,
    loading: authLoading,
    signOut,
    signIn,
    error,
    registerGoogleLogin,
    handleLoginSuccess,
    handleLoginError,
  } = useAuth();
  const { photos, addPhoto, deletePhoto, updatePhoto, loading: photosLoading } = usePhotos(user);
  const [activeView, setActiveView] = useState('gallery');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);

  // Keep the splash screen up for a beat even when auth resolves instantly,
  // so the artwork actually has time to register before the app appears.
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinSplashElapsed(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  const isMobile = () => window.innerWidth <= 768;

  const handleViewChange = (view) => {
    setActiveView(view);
    if (isMobile()) {
      setSidebarOpen(false);
    }
  };

  const handleSelectPhotoForEdit = (photo) => {
    setSelectedPhoto(photo);
    setActiveView('filters');
  };

  // Registers the Google OAuth login trigger with useAuth so signIn() has
  // something to call. Mounted whenever a Client ID is configured (matches
  // the GoogleOAuthProvider gate in index.js).
  const googleAuthBridge = isGoogleAuthConfigured() ? (
    <GoogleAuthBridge
      onSuccess={handleLoginSuccess}
      onError={handleLoginError}
      onReady={registerGoogleLogin}
    />
  ) : null;

  if (authLoading || !minSplashElapsed) {
    return (
      <>
        {googleAuthBridge}
        <Splash />
      </>
    );
  }

  if (!user) {
    return (
      <>
        {googleAuthBridge}
        <GoogleSignIn signIn={signIn} loading={authLoading} error={error} />
      </>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'gallery':
        return (
          <PhotoGallery
            photos={photos}
            loading={photosLoading}
            onDelete={deletePhoto}
            onSelect={handleSelectPhotoForEdit}
            onViewChange={setActiveView}
          />
        );
      case 'upload':
        return <PhotoUpload onUpload={addPhoto} user={user} />;
      case 'search':
        return <TagSearch photos={photos} onSelect={handleSelectPhotoForEdit} />;
      case 'filters':
        return <PhotoFilters photo={selectedPhoto} onSave={updatePhoto} onViewChange={setActiveView} />;
      case 'collage':
        return <CollageMaker photos={photos} />;
      case 'stories':
        return <PhotoStories photos={photos} />;
      case 'slideshow':
        return <PhotoSlideshow photos={photos} />;
      case 'memory-lane':
        return <MemoryLane photos={photos} />;
      case 'sharing':
        return <AlbumSharing photos={photos} user={user} />;
      case 'horse-profile':
        return <HorseProfile user={user} />;
      case 'settings':
        return <Settings user={user} />;
      default:
        return (
          <PhotoGallery
            photos={photos}
            loading={photosLoading}
            onDelete={deletePhoto}
            onSelect={handleSelectPhotoForEdit}
            onViewChange={setActiveView}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <div
        className="app-background"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        aria-hidden="true"
      />
      {googleAuthBridge}
      <Header
        user={user}
        onSignOut={signOut}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="app-body">
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          isOpen={sidebarOpen}
        />
        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {renderView()}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;
