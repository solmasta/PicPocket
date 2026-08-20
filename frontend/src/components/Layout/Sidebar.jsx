import React from 'react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'gallery', icon: '🖼️', label: 'Gallery' },
  { id: 'upload', icon: '📤', label: 'Upload' },
  { id: 'search', icon: '🔍', label: 'Tag Search' },
  { id: 'memory-lane', icon: '🕰️', label: 'Memory Lane' },
  { id: 'filters', icon: '✨', label: 'Filters' },
  { id: 'collage', icon: '🎨', label: 'Collage Maker' },
  { id: 'storage', icon: '🗄️', label: 'Storage' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

function Sidebar({ currentPage, onNavigate, isOpen, onClose }) {
  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
          <ul className="sidebar-menu">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose?.();
                  }}
                  aria-current={currentPage === item.id ? 'page' : undefined}
                >
                  <span className="sidebar-item__icon">{item.icon}</span>
                  <span className="sidebar-item__label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="sidebar-badge">
            <span className="sidebar-badge__icon">✨</span>
            <span className="sidebar-badge__text">Powered by AI</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;