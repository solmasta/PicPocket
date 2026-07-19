import React, { useState } from 'react';
import './App.css';

const DEMO_PHOTOS = [
  { id: 1, url: 'https://picsum.photos/seed/pocket1/400/300', title: 'Sunset hike' },
  { id: 2, url: 'https://picsum.photos/seed/pocket2/400/300', title: 'City lights' },
  { id: 3, url: 'https://picsum.photos/seed/pocket3/400/300', title: 'Morning coffee' },
  { id: 4, url: 'https://picsum.photos/seed/pocket4/400/300', title: 'Beach day' },
  { id: 5, url: 'https://picsum.photos/seed/pocket5/400/300', title: 'Forest path' },
  { id: 6, url: 'https://picsum.photos/seed/pocket6/400/300', title: 'Mountain view' },
];

function SignInForm({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    onSignIn(email);
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <h1 className="app-title">📷 PicPocket</h1>
        <p className="app-tagline">Your memories, safe and organised</p>
        <form className="signin-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn-primary">Sign in</button>
        </form>
      </div>
    </div>
  );
}

function Gallery({ user, onSignOut }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = DEMO_PHOTOS.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <span className="app-title-small">📷 PicPocket</span>
        <div className="header-actions">
          <span className="welcome-text">Welcome, {user}</span>
          <button className="btn-secondary" onClick={onSignOut}>Sign out</button>
        </div>
      </header>

      <main className="gallery-main">
        <div className="toolbar">
          <input
            className="search-input"
            type="search"
            placeholder="Search photos…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-primary upload-btn">+ Upload</button>
        </div>

        {filtered.length === 0 ? (
          <p className="no-results">No photos match "{searchTerm}".</p>
        ) : (
          <div className="photo-grid">
            {filtered.map((photo) => (
              <div key={photo.id} className="photo-card">
                <img src={photo.url} alt={photo.title} loading="lazy" />
                <p className="photo-title">{photo.title}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState('');

  const handleSignIn = (email) => {
    setUser(email);
    setIsSignedIn(true);
  };

  const handleSignOut = () => {
    setUser('');
    setIsSignedIn(false);
  };

  return isSignedIn ? (
    <Gallery user={user} onSignOut={handleSignOut} />
  ) : (
    <SignInForm onSignIn={handleSignIn} />
  );
}

export default App;
