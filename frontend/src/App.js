import React, { useState } from 'react';
import './App.css';
import CollageMaker from './Components/CollageMaker';
import PhotoFilters from './Components/PhotoFilters';
import HorseProfile from './Components/HorseProfile';
import PhotoStories from './Components/PhotoStories';

const TABS = [
  { id: 'collage',  label: '🖼 Collage' },
  { id: 'filters',  label: '✨ Filters' },
  { id: 'horse',    label: '🐴 Horse Profile' },
  { id: 'stories',  label: '📖 Stories' },
];

function App() {
  const [activeTab, setActiveTab] = useState('collage');

  return (
    <div className="App" style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f9fafb' }}>
      <header style={{ background: '#6366f1', color: '#fff', padding: '16px 24px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>📸 PicPocket</h1>
      </header>

      <nav style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '7px 14px', borderRadius: 20,
              border: '1px solid',
              borderColor: activeTab === tab.id ? '#6366f1' : '#e5e7eb',
              background: activeTab === tab.id ? '#6366f1' : '#fff',
              color: activeTab === tab.id ? '#fff' : '#374151',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={{ padding: '24px 0' }}>
        {activeTab === 'collage'  && <CollageMaker />}
        {activeTab === 'filters'  && <PhotoFilters />}
        {activeTab === 'horse'    && <HorseProfile />}
        {activeTab === 'stories'  && <PhotoStories />}
      </main>
    </div>
  );
}

export default App;
