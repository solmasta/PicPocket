import React from 'react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'gallery', icon: '🖼️', label: 'Gallery' },
  { id: 'upload', icon: '📤', label: 'Upload' },
  { id: 'search', icon: '🔍', label: 'Tag Search' },
  { id: 'memory-lane', icon: '🕰️', label: 'Memory Lane' },
  { id: 'filters', icon: '✨', label: 'Filters' },
  { id: 'collage', icon: '🎨', label: 'Collage Maker' },
  { id: 'stories', icon: '📖', label: 'Photo Stories' },
  { id: 'slideshow', icon: '▶️', label: 'Slideshow' },
  { id: 'sharing', icon: '🔗', label: 'Albums & Sharing' },
  { id: 'horse-profile', icon: '🐴', label: 'Horse Profile' },
  { id: 'storage', icon: '🗄️', label: 'Storage Ledger' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

function Sidebar({ activeView, onViewChange, isOpen }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item ${activeView === item.id ? 'active' : ''} ${item.id === 'horse-profile' ? 'horse-theme' : ''}`}
                onClick={() => onViewChange(item.id)}
                title={item.label}
                aria-pressed={activeView === item.id}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;