import React, { useState, useEffect, useCallback } from 'react';
import { useAppState } from '../../context/AppStateContext';
import './OfflineIndicator.css';

function OfflineIndicator() {
  const { isOnline, addNotification } = useAppState();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline && !wasOffline) {
      setWasOffline(true);
      setShowBanner(true);
      addNotification('You are offline. Some features may be limited.', 'warning', 0);
    } else if (isOnline && wasOffline) {
      setShowBanner(false);
      setWasOffline(false);
      addNotification('You are back online!', 'success', 3000);
    }
  }, [isOnline, wasOffline, addNotification]);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  if (!showBanner || isOnline) {
    return null;
  }

  return (
    <div className="offline-indicator" role="alert">
      <div className="offline-content">
        <svg className="offline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d="M18.364 5.636a9 9 0 010 12.728m-4.95-4.95a5 5 0 000-7.07m-7.07 14.14a9 9 0 010-12.728" />
          <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
        <span className="offline-text">You are offline</span>
        <button 
          className="offline-dismiss" 
          onClick={dismissBanner}
          aria-label="Dismiss notification"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default OfflineIndicator;