import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorProvider } from './context/ErrorContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
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
import OfflineIndicator from './components/Common/OfflineIndicator';
import { useAuth } from './hooks/useAuth';
import { usePhotos } from './hooks/usePhotos';
import { useStorageConnections } from './hooks/useStorageConnections';
import { isGoogleAuthConfigured } from './config/googleAuth';

const ErrorFallback = ({ error, retry }) => (
  <div className="error-fallback">
    <div className="error-fallback__content">
      <h2>Something went wrong</h2>
      <p>{error?.message || 'An unexpected error occurred'}</p>
      <div className="error-fallback__actions">
        <button onClick={retry} className="btn btn--primary">Try Again</button>
        <button onClick={() => window.location.reload()} className="btn btn--secondary">Reload Page</button>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ErrorProvider>
        <Routes>
          <Route path="/album/:token" element={<SharedAlbumView />} />
          <Route path="*" element={<MainApp />} />
        </Routes>
      </ErrorProvider>
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
    continueLocally,
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

  const googleAuthBridge = isGoogleAuthConfigured() ? (
    <GoogleAuthBridge
      onSuccess={handleLoginSuccess}
      onError={handleLoginError}
      onReady={registerGoogleLogin}
    />
  ) : null;

  if (authLoading || !minSplashElapsed) {
    return (
      <ErrorBoundary fallback={ErrorFallback}>
        <OfflineIndicator />
        {googleAuthBridge}
        <Splash />
      </ErrorBoundary>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary fallback={ErrorFallback}>
        <OfflineIndicator />
        {googleAuthBridge}
        <GoogleSignIn
          signIn={signIn}
          continueLocally={continueLocally}
          loading={authLoading}
          error={error}
        />
      </ErrorBoundary>
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
        return (
          <Settings
            user={user}
            storageConnections={storageConnections}
            onSignInGoogle={signIn}
            onContinueLocally={continueLocally}
            onSignOut={signOut}
          />
        );
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
        <OfflineIndicator />
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
            <ErrorBoundary fallback={ErrorFallback}>
              {renderView()}
            </ErrorBoundary>
          </main>
        </div>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;