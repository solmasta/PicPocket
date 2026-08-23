// Testing setup for PicPocket application

// Import Jest DOM for custom matchers
import '@testing-library/jest-dom';

// Mock IndexedDB for testing
const indexedDBMock = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          add: jest.fn(),
          get: jest.fn(),
          getAll: jest.fn(),
          put: jest.fn(),
          delete: jest.fn(),
          index: jest.fn()
        }))
      }))
    }
  })),
  deleteDatabase: jest.fn()
};

// Mock performance API for testing
const performanceMock = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => [])
};

// Mock IntersectionObserver for testing
const intersectionObserverMock = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock ResizeObserver for testing
const resizeObserverMock = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock matchMedia for testing
const matchMediaMock = jest.fn((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

// Mock sessionStorage for testing
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

// Mock URL.createObjectURL for testing
const createObjectURLMock = jest.fn(() => 'mock-url');
const revokeObjectURLMock = jest.fn();

// Mock File and FileReader for testing
const fileReaderMock = {
  readAsDataURL: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  result: null,
  onload: null,
  onerror: null
};

// Mock geolocation API for testing
const geolocationMock = {
  getCurrentPosition: jest.fn((success) => {
    success({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10
      },
      timestamp: Date.now()
    });
  }),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

// Mock canvas for image processing
const canvasMock = {
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 100,
      height: 100
    })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 100,
      height: 100
    })),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    translate: jest.fn()
  })),
  toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
  width: 100,
  height: 100
};

// Set up global mocks
Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: indexedDBMock
});

Object.defineProperty(window, 'performance', {
  writable: true,
  value: performanceMock
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: intersectionObserverMock
});

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: resizeObserverMock
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock
});

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: sessionStorageMock
});

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: createObjectURLMock
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: revokeObjectURLMock
});

Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: jest.fn(() => fileReaderMock)
});

Object.defineProperty(window, 'geolocation', {
  writable: true,
  value: geolocationMock
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: canvasMock.getContext
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  writable: true,
  value: canvasMock.toDataURL
});

Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
  writable: true,
  value: 100
});

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
  writable: true,
  value: 100
});

// Mock crypto for content hashing
Object.defineProperty(window, 'crypto', {
  writable: true,
  value: {
    subtle: {
      digest: jest.fn(() => Promise.resolve(new ArrayBuffer(8)))
    }
  }
});

// Mock fetch for API testing
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data: [] })
  })
);

// Custom matchers for better testing assertions
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveBeenCalledWithObjectContaining(received, expected) {
    const pass = received.mock.calls.some(call =>
      call.some(arg => 
        typeof arg === 'object' && 
        Object.keys(expected).every(key => arg[key] === expected[key])
      )
    );
    
    if (pass) {
      return {
        message: () => `expected mock not to have been called with object containing ${JSON.stringify(expected)}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected mock to have been called with object containing ${JSON.stringify(expected)}`,
        pass: false,
      };
    }
  },

  toBeAccessible(received) {
    // Basic accessibility checks
    const hasAlt = received.hasAttribute('alt') || received.hasAttribute('aria-label');
    const hasRole = received.hasAttribute('role') || ['button', 'link', 'img', 'input'].includes(received.tagName.toLowerCase());
    const hasTabIndex = received.hasAttribute('tabindex') || ['button', 'link', 'input'].includes(received.tagName.toLowerCase());
    
    const isAccessible = hasAlt && hasRole && hasTabIndex;
    
    return {
      message: () => isAccessible 
        ? `expected element not to be accessible` 
        : `expected element to be accessible (missing alt, role, or tabindex)`,
      pass: isAccessible,
    };
  }
});

// Helper functions for testing
export const createMockPhoto = (overrides = {}) => ({
  id: 'test-photo-1',
  name: 'Test Photo',
  url: 'https://example.com/photo.jpg',
  size: 1024,
  type: 'image/jpeg',
  width: 800,
  height: 600,
  createdAt: '2023-01-01T00:00:00Z',
  modifiedAt: '2023-01-01T00:00:00Z',
  tags: ['test'],
  isFavorite: false,
  isArchived: false,
  albums: [],
  backups: [],
  hash: 'test-hash',
  orientation: 1,
  colorSpace: 'sRGB',
  ...overrides
});

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: '2023-01-01T00:00:00Z',
  lastLoginAt: '2023-01-01T00:00:00Z',
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      backupReminders: true,
      sharingAlerts: true
    },
    privacy: {
      locationServices: false,
      analytics: false,
      crashReporting: false,
      autoBackup: false
    },
    storage: {
      compressionLevel: 80,
      thumbnailQuality: 80,
      autoDeleteDuplicates: true,
      maxStorageSize: 1000
    }
  },
  ...overrides
});

export const createMockFile = (overrides = {}) => ({
  name: 'test-photo.jpg',
  type: 'image/jpeg',
  size: 1024,
  lastModified: Date.now(),
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
  slice: jest.fn(),
  stream: jest.fn(),
  text: () => Promise.resolve('test'),
  ...overrides
});

export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Export mocks for use in tests
export {
  indexedDBMock,
  performanceMock,
  intersectionObserverMock,
  resizeObserverMock,
  matchMediaMock,
  localStorageMock,
  sessionStorageMock,
  createObjectURLMock,
  revokeObjectURLMock,
  fileReaderMock,
  geolocationMock,
  canvasMock
};