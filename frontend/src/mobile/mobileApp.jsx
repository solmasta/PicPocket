/**
 * Mobile App Component
 * Progressive Web App with native mobile features
 * Camera integration, offline support, and mobile-optimized UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import './mobileApp.css';

const MobileApp = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [notificationsPermission, setNotificationsPermission] = useState('prompt');
  const [geolocationPermission, setGeolocationPermission] = useState('prompt');
  const [isMobile, setIsMobile] = useState(false);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    initializeMobileFeatures();
    setupEventListeners();
    detectMobileDevice();
  }, []);

  const initializeMobileFeatures = async () => {
    // Check if app is installed
    setIsInstalled(checkIfInstalled());
    
    // Check permissions
    await checkPermissions();
    
    // Setup service worker
    await setupServiceWorker();
    
    // Setup push notifications
    await setupPushNotifications();
  };

  const setupEventListeners = () => {
    // Install prompt
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    
    // App installed
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Online/offline status
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    
    // Viewport changes
    window.addEventListener('resize', handleViewportChange);
    
    // Orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Back button (Android)
    if ('onbackbutton' in window) {
      window.addEventListener('backbutton', handleBackButton);
    }
    
    // Visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  const detectMobileDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    setIsMobile(isMobileDevice);
  };

  const handleInstallPrompt = (e) => {
    e.preventDefault();
    setInstallPrompt(e);
  };

  const handleAppInstalled = () => {
    setIsInstalled(true);
    setInstallPrompt(null);
  };

  const handleViewportChange = () => {
    setViewport({ width: window.innerWidth, height: window.innerHeight });
  };

  const handleOrientationChange = () => {
    // Handle orientation-specific UI changes
    setTimeout(() => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }, 100);
  };

  const handleBackButton = () => {
    // Custom back button handling
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Minimize app or show exit confirmation
      showExitConfirmation();
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      // App is hidden, pause operations
      pauseAppOperations();
    } else {
      // App is visible, resume operations
      resumeAppOperations();
    }
  };

  const checkIfInstalled = () => {
    // Check if app is running in standalone mode
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  };

  const checkPermissions = async () => {
    // Camera permission
    try {
      const cameraStatus = await navigator.permissions.query({ name: 'camera' });
      setCameraPermission(cameraStatus.state);
      cameraStatus.addEventListener('change', () => setCameraPermission(cameraStatus.state));
    } catch (error) {
      console.log('Camera permission not supported');
    }

    // Notifications permission
    try {
      const notificationStatus = await navigator.permissions.query({ name: 'notifications' });
      setNotificationsPermission(notificationStatus.state);
      notificationStatus.addEventListener('change', () => setNotificationsPermission(notificationStatus.state));
    } catch (error) {
      console.log('Notification permission not supported');
    }

    // Geolocation permission
    try {
      const geolocationStatus = await navigator.permissions.query({ name: 'geolocation' });
      setGeolocationPermission(geolocationStatus.state);
      geolocationStatus.addEventListener('change', () => setGeolocationPermission(geolocationStatus.state));
    } catch (error) {
      console.log('Geolocation permission not supported');
    }
  };

  const setupServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              showUpdateAvailable();
            }
          });
        });
        
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  };

  const setupPushNotifications = async () => {
    if ('PushManager' in window && 'Notification' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Request permission and subscribe
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const newSubscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
            });
            console.log('Push subscription created:', newSubscription);
          }
        }
      } catch (error) {
        console.error('Push notification setup failed:', error);
      }
    }
  };

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setCameraPermission('granted');
      return stream;
    } catch (error) {
      setCameraPermission('denied');
      throw error;
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationsPermission(permission);
      return permission;
    } catch (error) {
      setNotificationsPermission('denied');
      throw error;
    }
  };

  const requestGeolocationPermission = async () => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      setGeolocationPermission('granted');
      return position;
    } catch (error) {
      setGeolocationPermission('denied');
      throw error;
    }
  };

  const installApp = async () => {
    if (installPrompt) {
      const result = await installPrompt.prompt();
      const outcome = await result.userChoice;
      setInstallPrompt(null);
      
      if (outcome === 'accepted') {
        console.log('App installed successfully');
      } else {
        console.log('App installation declined');
      }
    }
  };

  const showUpdateAvailable = () => {
    // Show update notification
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
      <div class="update-content">
        <span>A new version is available!</span>
        <button onclick="window.location.reload()">Update</button>
        <button onclick="this.parentElement.parentElement.remove()">Later</button>
      </div>
    `;
    document.body.appendChild(updateBanner);
  };

  const showExitConfirmation = () => {
    // Show exit confirmation for mobile
    if (window.confirm('Are you sure you want to exit the app?')) {
      window.close();
    }
  };

  const pauseAppOperations = () => {
    // Pause background operations when app is hidden
    console.log('Pausing app operations');
  };

  const resumeAppOperations = () => {
    // Resume operations when app becomes visible
    console.log('Resuming app operations');
  };

  const shareContent = async (title, text, url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const shareData = `${title} - ${text} ${url}`;
      await navigator.clipboard.writeText(shareData);
      alert('Link copied to clipboard!');
    }
  };

  const vibrate = (pattern) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const openCamera = async () => {
    try {
      const stream = await requestCameraAccess();
      return stream;
    } catch (error) {
      console.error('Camera access failed:', error);
      throw error;
    }
  };

  const capturePhoto = async (videoElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const getDeviceOrientation = () => {
    return new Promise((resolve, reject) => {
      if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
        
        function handleOrientation(event) {
          window.removeEventListener('deviceorientation', handleOrientation);
          resolve({
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma
          });
        }
        
        // Timeout if no orientation data
        setTimeout(() => {
          window.removeEventListener('deviceorientation', handleOrientation);
          reject(new Error('Device orientation not available'));
        }, 5000);
      } else {
        reject(new Error('Device orientation not supported'));
      }
    });
  };

  // Mobile-specific gestures
  const setupGestures = (element) => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    element.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    });

    element.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    });

    const handleSwipe = () => {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 50) {
          element.dispatchEvent(new CustomEvent('swipeRight'));
        } else if (deltaX < -50) {
          element.dispatchEvent(new CustomEvent('swipeLeft'));
        }
      } else {
        // Vertical swipe
        if (deltaY > 50) {
          element.dispatchEvent(new CustomEvent('swipeDown'));
        } else if (deltaY < -50) {
          element.dispatchEvent(new CustomEvent('swipeUp'));
        }
      }
    };
  };

  const context = {
    // Device info
    isInstalled,
    isMobile,
    isOnline,
    viewport,
    
    // Permissions
    cameraPermission,
    notificationsPermission,
    geolocationPermission,
    
    // Methods
    installApp,
    requestCameraAccess,
    requestNotificationPermission,
    requestGeolocationPermission,
    shareContent,
    vibrate,
    openCamera,
    capturePhoto,
    getDeviceOrientation,
    setupGestures
  };

  return (
    <MobileContext.Provider value={context}>
      <div className={`mobile-app ${isMobile ? 'mobile' : 'desktop'} ${!isOnline ? 'offline' : ''}`}>
        {/* Install Banner */}
        {installPrompt && !isInstalled && (
          <div className="install-banner">
            <div className="install-content">
              <span>Install PicPocket for the best experience!</span>
              <button onClick={installApp}>Install</button>
              <button onClick={() => setInstallPrompt(null)}>Dismiss</button>
            </div>
          </div>
        )}

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="offline-indicator">
            <span>You're offline. Some features may be limited.</span>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMobile && (
          <MobileNavigation />
        )}

        {/* Main Content */}
        <main className="mobile-content">
          {children}
        </main>

        {/* Mobile Bottom Bar */}
        {isMobile && (
          <MobileBottomBar />
        )}
      </div>
    </MobileContext.Provider>
  );
};

// Mobile Context
const MobileContext = React.createContext();

// Mobile Navigation Component
const MobileNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <nav className="mobile-nav">
      <button 
        className="menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        ☰
      </button>
      
      <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
        <a href="/">Home</a>
        <a href="/gallery">Gallery</a>
        <a href="/upload">Upload</a>
        <a href="/search">Search</a>
        <a href="/settings">Settings</a>
      </div>
    </nav>
  );
};

// Mobile Bottom Bar Component
const MobileBottomBar = () => {
  const { shareContent } = React.useContext(MobileContext);
  const [activeTab, setActiveTab] = useState('home');
  
  const handleShare = async () => {
    await shareContent('PicPocket', 'Check out my photos!', window.location.href);
  };
  
  return (
    <div className="mobile-bottom-bar">
      <button 
        className={`tab ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => setActiveTab('home')}
      >
        🏠
      </button>
      <button 
        className={`tab ${activeTab === 'gallery' ? 'active' : ''}`}
        onClick={() => setActiveTab('gallery')}
      >
        📷
      </button>
      <button 
        className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
        onClick={() => setActiveTab('upload')}
      >
        ➕
      </button>
      <button 
        className={`tab ${activeTab === 'share' ? 'active' : ''}`}
        onClick={handleShare}
      >
        📤
      </button>
      <button 
        className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
      >
        👤
      </button>
    </div>
  );
};

export default MobileApp;
export { MobileContext };