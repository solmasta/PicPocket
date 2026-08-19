import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import './styles/App.css';
import './styles/components.css';
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
import StorageLedger from './components/Storage/StorageLedger';
import AIStorageInsights from './components/Storage/AIStorageInsights';
import Settings from './components/Settings/Settings';
import { useAuth } from './hooks/useAuth';
import { usePhotos } from './hooks/usePhotos';
import { useStorageConnections } from './hooks/useStorageConnections';
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
    tokenExpired,
    signOut,
    signIn,
    error,
    registerGoogleLogin,
    handleLoginSuccess,
    handleLoginError,
  } = useAuth();
  const { photos, addPhoto, deletePhoto, updatePhoto, loading: photosLoading } = usePhotos(user);
  const storageConnections = useStorageConnections();
  const [activeView, setActiveView] = useState('gallery');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  // Tracks which side of the mobile/desktop breakpoint we were last on, so a
  // resize (window shrink, device rotation) that crosses it can reset the
  // sidebar to that breakpoint's default open/closed state — without this,
  // sidebarOpen is only ever set at mount and a later resize leaves it stuck
  // (e.g. a desktop-open sidebar staying open, full-width, after shrinking
  // to a mobile viewport). Resizes that stay within the same breakpoint
  // don't touch it, so a manual toggle via the hamburger isn't fought.
  const isDesktopRef = useRef(window.innerWidth > 768);
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth > 768;
      if (desktop !== isDesktopRef.current) {
        isDesktopRef.current = desktop;
        setSidebarOpen(desktop);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keep the splash screen up for a beat even when auth resolves instantly,
  // so the artwork actually has time to register before the app appears.
  // Skipped under test, where nothing is waiting out a real timer.
  const [minSplashElapsed, setMinSplashElapsed] = useState(
    () => process.env.NODE_ENV === 'test'
  );
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') return undefined;
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
        return (
          <PhotoUpload
            onUpload={addPhoto}
            onBackupComplete={updatePhoto}
            user={user}
            storageConnections={storageConnections}
          />
        );
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
      case 'storage':
        return (
          <>
            <AIStorageInsights photos={photos} onDelete={deletePhoto} />
            <StorageLedger
              photos={photos}
              user={user}
              onImport={addPhoto}
              onImportBackupTag={updatePhoto}
              storageConnections={storageConnections}
            />
          </>
        );
      case 'settings':
        return <Settings user={user} storageConnections={storageConnections} />;
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
    <ThemeProvider>
      <div className="app-container">
        <div
          className="app-background"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          aria-hidden="true"
        />
        {googleAuthBridge}
        <Header
          user={user}
          tokenExpired={tokenExpired}
          onSignOut={signOut}
          onReconnect={signIn}
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
          <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} role="main">
            {renderView()}
          </main>
        </div>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;