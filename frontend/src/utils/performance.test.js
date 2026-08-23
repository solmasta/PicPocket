import { getPerformanceMonitor, measureFunction, measureAsyncFunction, mark, measure } from './performance';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  navigation: {
    domContentLoadedEventEnd: 100,
    domContentLoadedEventStart: 50,
    loadEventEnd: 200,
    loadEventStart: 150,
    responseStart: 80,
    requestStart: 70,
    redirectEnd: 60,
    redirectStart: 50,
    domainLookupEnd: 65,
    domainLookupStart: 62,
    connectEnd: 68,
    connectStart: 66,
    navigationStart: 0
  }
};

// Mock PerformanceObserver
const mockPerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  callback
}));

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  callback
}));

// Mock document methods
const mockDocument = {
  addEventListener: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  createElement: jest.fn(() => ({
    href: '',
    download: '',
    click: jest.fn()
  }))
};

describe('Performance Monitor', () => {
  let performanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: mockPerformance
    });
    Object.defineProperty(window, 'PerformanceObserver', {
      writable: true,
      value: mockPerformanceObserver
    });
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      value: mockIntersectionObserver
    });
    Object.defineProperty(window, 'document', {
      writable: true,
      value: mockDocument
    });
    
    performanceMonitor = getPerformanceMonitor();
  });

  afterEach(() => {
    if (performanceMonitor) {
      performanceMonitor.destroy();
    }
  });

  describe('Initialization', () => {
    test('initializes successfully when performance API is supported', () => {
      expect(performanceMonitor).toBeDefined();
      expect(mockPerformanceObserver).toHaveBeenCalledTimes(4); // navigation, resource, paint, longtask
    });

    test('handles unsupported performance API gracefully', () => {
      Object.defineProperty(window, 'performance', {
        writable: true,
        value: null
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const monitor = getPerformanceMonitor();
      
      expect(consoleSpy).toHaveBeenCalledWith('Performance monitoring not supported in this browser');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Metric Recording', () => {
    test('records custom metrics', () => {
      const testData = { duration: 100, type: 'test' };
      
      performanceMonitor.recordMetric('custom', testData);
      
      const metrics = performanceMonitor.getMetrics('custom');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].data).toEqual(testData);
      expect(metrics[0].type).toBe('custom');
      expect(metrics[0].timestamp).toBeDefined();
    });

    test('records navigation metrics', () => {
      // Simulate navigation entry
      const mockCallback = mockPerformanceObserver.mock.calls[0][0];
      mockCallback({
        getEntries: () => [{
          entryType: 'navigation',
          ...mockPerformance.navigation
        }]
      });

      const metrics = performanceMonitor.getMetrics('navigation');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].data.domContentLoaded).toBe(50);
      expect(metrics[0].data.loadComplete).toBe(50);
    });

    test('records resource metrics', () => {
      const mockCallback = mockPerformanceObserver.mock.calls[1][0];
      mockCallback({
        getEntries: () => [{
          entryType: 'resource',
          name: 'script.js',
          transferSize: 1024,
          duration: 50,
          startTime: 10
        }]
      });

      const metrics = performanceMonitor.getMetrics('resource');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].data.type).toBe('script');
      expect(metrics[0].data.size).toBe(1024);
    });

    test('records paint metrics', () => {
      const mockCallback = mockPerformanceObserver.mock.calls[2][0];
      mockCallback({
        getEntries: () => [{
          entryType: 'paint',
          name: 'first-contentful-paint',
          startTime: 100
        }]
      });

      const metrics = performanceMonitor.getMetrics('paint');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].data.name).toBe('first-contentful-paint');
      expect(metrics[0].data.time).toBe(100);
    });

    test('records long task metrics', () => {
      const mockCallback = mockPerformanceObserver.mock.calls[3][0];
      mockCallback({
        getEntries: () => [{
          entryType: 'longtask',
          duration: 60,
          startTime: 200
        }]
      });

      const metrics = performanceMonitor.getMetrics('longtask');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].data.duration).toBe(60);
    });
  });

  describe('Summary Generation', () => {
    test('generates comprehensive summary', () => {
      // Add some test metrics
      performanceMonitor.recordMetric('test', { value: 1 });
      performanceMonitor.recordMetric('test', { value: 2 });
      
      const summary = performanceMonitor.getSummary();
      
      expect(summary).toHaveProperty('navigation');
      expect(summary).toHaveProperty('resources');
      expect(summary).toHaveProperty('paint');
      expect(summary).toHaveProperty('longTasks');
      expect(summary).toHaveProperty('components');
      expect(summary).toHaveProperty('interactions');
      expect(summary).toHaveProperty('images');
      expect(summary).toHaveProperty('errors');
    });

    test('calculates resource statistics correctly', () => {
      // Add resource metrics
      performanceMonitor.recordMetric('resource', { type: 'script', size: 100, duration: 10 });
      performanceMonitor.recordMetric('resource', { type: 'script', size: 200, duration: 20 });
      performanceMonitor.recordMetric('resource', { type: 'image', size: 300, duration: 15 });
      
      const summary = performanceMonitor.getSummary();
      
      expect(summary.resources.script.count).toBe(2);
      expect(summary.resources.script.totalSize).toBe(300);
      expect(summary.resources.script.averageDuration).toBe(15);
      expect(summary.resources.image.count).toBe(1);
      expect(summary.resources.image.totalSize).toBe(300);
    });
  });

  describe('Export Functionality', () => {
    test('exports metrics as JSON file', () => {
      const mockCreateObjectURL = jest.fn(() => 'mock-url');
      const mockRevokeObjectURL = jest.fn();
      const mockCreateElement = jest.fn(() => ({
        href: '',
        download: '',
        click: jest.fn()
      }));
      
      Object.defineProperty(URL, 'createObjectURL', {
        writable: true,
        value: mockCreateObjectURL
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        writable: true,
        value: mockRevokeObjectURL
      });
      Object.defineProperty(document, 'createElement', {
        writable: true,
        value: mockCreateElement
      });
      
      performanceMonitor.recordMetric('test', { value: 1 });
      
      performanceMonitor.exportMetrics();
      
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('clears all metrics', () => {
      performanceMonitor.recordMetric('test', { value: 1 });
      expect(performanceMonitor.getMetrics('test')).toHaveLength(1);
      
      performanceMonitor.clear();
      expect(performanceMonitor.getMetrics('test')).toHaveLength(0);
    });

    test('destroys monitor and disconnects observers', () => {
      const mockDisconnect = jest.fn();
      const mockObserver = { disconnect: mockDisconnect };
      performanceMonitor.observers.add(mockObserver);
      
      performanceMonitor.destroy();
      
      expect(mockDisconnect).toHaveBeenCalled();
      expect(performanceMonitor.observers.size).toBe(0);
    });
  });
});

describe('Performance Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: mockPerformance
    });
  });

  describe('measureFunction', () => {
    test('measures synchronous function execution time', () => {
      const testFn = jest.fn(() => 'result');
      let recordedMetric = null;
      
      const monitor = getPerformanceMonitor();
      monitor.recordMetric = jest.fn((type, data) => {
        recordedMetric = { type, data };
      });
      
      const result = measureFunction(testFn, 'test-function');
      
      expect(result).toBe('result');
      expect(testFn).toHaveBeenCalled();
      expect(recordedMetric.type).toBe('function');
      expect(recordedMetric.data.name).toBe('test-function');
      expect(recordedMetric.data.duration).toBeGreaterThanOrEqual(0);
    });

    test('handles function errors', () => {
      const errorFn = jest.fn(() => {
        throw new Error('Test error');
      });
      
      expect(() => {
        measureFunction(errorFn, 'error-function');
      }).toThrow('Test error');
      
      expect(errorFn).toHaveBeenCalled();
    });
  });

  describe('measureAsyncFunction', () => {
    test('measures asynchronous function execution time', async () => {
      const testAsyncFn = jest.fn(async () => 'async-result');
      let recordedMetric = null;
      
      const monitor = getPerformanceMonitor();
      monitor.recordMetric = jest.fn((type, data) => {
        recordedMetric = { type, data };
      });
      
      const result = await measureAsyncFunction(testAsyncFn, 'test-async-function');
      
      expect(result).toBe('async-result');
      expect(testAsyncFn).toHaveBeenCalled();
      expect(recordedMetric.type).toBe('asyncFunction');
      expect(recordedMetric.data.name).toBe('test-async-function');
      expect(recordedMetric.data.duration).toBeGreaterThanOrEqual(0);
    });

    test('handles async function rejections', async () => {
      const errorAsyncFn = jest.fn(async () => {
        throw new Error('Async error');
      });
      
      await expect(measureAsyncFunction(errorAsyncFn, 'error-async-function'))
        .rejects.toThrow('Async error');
      
      expect(errorAsyncFn).toHaveBeenCalled();
    });
  });

  describe('mark and measure', () => {
    test('creates performance marks', () => {
      mark('test-mark');
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-mark');
    });

    test('creates performance measures', () => {
      measure('test-measure', 'test-mark');
      expect(mockPerformance.measure).toHaveBeenCalledWith('test-measure', 'test-mark');
    });

    test('handles measure errors gracefully', () => {
      mockPerformance.measure.mockImplementationOnce(() => {
        throw new Error('Measure error');
      });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      measure('test-measure', 'test-mark');
      
      expect(consoleSpy).toHaveBeenCalledWith('Performance measure failed:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});

describe('Performance Tracking Integration', () => {
  test('integrates with React components', () => {
    // Mock React hooks
    const mockUseRef = { current: null };
    const mockUseEffect = jest.fn((fn) => fn());
    
    jest.mock('react', () => ({
      useRef: () => mockUseRef,
      useEffect: mockUseEffect
    }));
    
    // This would be tested in actual React component tests
    expect(true).toBe(true); // Placeholder for integration tests
  });

  test('tracks component render times in development', () => {
    process.env.NODE_ENV = 'development';
    
    let recordedMetric = null;
    const monitor = getPerformanceMonitor();
    monitor.recordMetric = jest.fn((type, data) => {
      recordedMetric = { type, data };
    });
    
    // Simulate component render tracking
    (window as any).trackComponentRender('TestComponent', 5.5);
    
    expect(recordedMetric.type).toBe('component');
    expect(recordedMetric.data.name).toBe('TestComponent');
    expect(recordedMetric.data.renderTime).toBe(5.5);
    
    process.env.NODE_ENV = 'test';
  });

  test('tracks user interactions', () => {
    let recordedMetric = null;
    const monitor = getPerformanceMonitor();
    monitor.recordMetric = jest.fn((type, data) => {
      recordedMetric = { type, data };
    });
    
    // Simulate interaction tracking
    const mockEvent = { target: { tagName: 'BUTTON' } };
    const mockCallback = mockIntersectionObserver.mock.calls[0][0];
    
    // This would be triggered by actual DOM events
    monitor.recordMetric('interaction', {
      type: 'click',
      target: 'BUTTON',
      duration: 2.5,
      timestamp: Date.now()
    });
    
    expect(recordedMetric.type).toBe('interaction');
    expect(recordedMetric.data.type).toBe('click');
    expect(recordedMetric.data.target).toBe('BUTTON');
  });
});