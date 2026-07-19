import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import GoogleSignIn from './components/Auth/GoogleSignIn';
import PhotoGallery from './components/Gallery/PhotoGallery';
import PhotoUpload from './components/Upload/PhotoUpload';
import TagSearch from './components/Tags/TagSearch';
import PhotoFilters from './components/Filters/PhotoFilters';
import CollageMaker from './components/Collage/CollageMaker';
import PhotoStories from './components/Stories/PhotoStories';
import PhotoSlideshow from './components/Slideshow/PhotoSlideshow';
import MemoryLane from './components/MemoryLane/MemoryLane';
import AlbumSharing from './components/Sharing/AlbumSharing';
import HorseProfile from './components/HorseProfile';
import Settings from './components/Settings/Settings';
import { useAuth } from './hooks/useAuth';
import { usePhotos } from './hooks/usePhotos';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { photos, addPhoto, deletePhoto, updatePhoto, loading: photosLoading } = usePhotos(user);
  const [activeView, setActiveView] = useState('gallery');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading PicPals...</p>
      </div>
    );
  }

  if (!user) {
    return <GoogleSignIn />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'gallery':
        return (
          <PhotoGallery
            photos={photos}
            loading={photosLoading}
            onDelete={deletePhoto}
            onSelect={setSelectedPhoto}
            onViewChange={setActiveView}
          />
        );
      case 'upload':
        return <PhotoUpload onUpload={addPhoto} user={user} />;
      case 'search':
        return <TagSearch photos={photos} onSelect={setSelectedPhoto} />;
      case 'filters':
        return <PhotoFilters photo={selectedPhoto} onSave={updatePhoto} />;
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
        return <HorseProfile />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <PhotoGallery
            photos={photos}
            loading={photosLoading}
            onDelete={deletePhoto}
            onSelect={setSelectedPhoto}
            onViewChange={setActiveView}
          />
        );
    }
  };

  return (
    <Router>
      <div className="app-container">
        <Header
          user={user}
          onSignOut={signOut}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="app-body">
          <Sidebar
            activeView={activeView}
            onViewChange={setActiveView}
            isOpen={sidebarOpen}
          />
          <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <Routes>
              <Route path="/" element={renderView()} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
