import React from 'react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'gallery', icon: '🖼️', label: 'Gallery' },
  { id: 'upload', icon: '📤', label: 'Upload' },
  { id: 'search', icon: '🔍', label: 'Tag Search' },
  { id: 'memory-lane', icon: '🕰️', label: 'Memory Lane' },
  { id: 'filters', icon: '✨', label: 'Filters' },
  { id: 'collage', icon: '🎨', label: 'Collage Maker' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

function Sidebar({ activeView, onViewChange, isCollapsed, onToggleCollapse }) {
  return (
    <aside 
      className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <nav className="sidebar__nav">
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                className={`sidebar__nav-item ${
                  activeView === item.id ? 'sidebar__nav-item--active' : ''
                }`}
                onClick={() => onViewChange(item.id)}
                aria-label={item.label}
                aria-current={activeView === item.id ? 'page' : undefined}
              >
                <span className="sidebar__nav-icon" aria-hidden="true">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar__footer">
        {!isCollapsed && (
          <div className="sidebar__version">
            PicPocket v1.0
          </div>
        )}
        <button
          className="sidebar__nav-item"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{ marginTop: 'auto' }}
        >
          <span className="sidebar__nav-icon" aria-hidden="true">
            {isCollapsed ? '▶️' : '◀️'}
          </span>
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;