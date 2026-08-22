import { 
  debounce, 
  throttle, 
  batchProcess,
  chunkedIterator,
  estimateMemorySize 
} from '../utils/performance';

describe('performance utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const func = jest.fn();
      const debounced = debounce(func, 100);

      debounced();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on repeated calls', () => {
      const func = jest.fn();
      const debounced = debounce(func, 100);

      debounced();
      jest.advanceTimersByTime(50);
      debounced();
      jest.advanceTimersByTime(50);
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the function', () => {
      const func = jest.fn();
      const debounced = debounce(func, 100);

      debounced('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    it('should limit function calls', () => {
      const func = jest.fn();
      const throttled = throttle(func, 100);

      throttled();
      expect(func).toHaveBeenCalledTimes(1);

      throttled();
      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttled();
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments to the function', () => {
      const func = jest.fn();
      const throttled = throttle(func, 100);

      throttled('arg1');
      throttled('arg2');
      jest.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith('arg1');
    });
  });

  describe('batchProcess', () => {
    it('should process items with concurrency', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = jest.fn((item) => Promise.resolve(item * 2));

      const results = await batchProcess(items, processor, { concurrency: 2 });

      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(processor).toHaveBeenCalledTimes(5);
    });

    it('should call onProgress callback', async () => {
      const items = [1, 2, 3, 4];
      const processor = jest.fn((item) => Promise.resolve(item));
      const onProgress = jest.fn();

      await batchProcess(items, processor, { concurrency: 2, onProgress });

      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('chunkedIterator', () => {
    it('should iterate over chunks', () => {
      const items = [1, 2, 3, 4, 5];
      const callback = jest.fn();

      chunkedIterator(items, 2, callback);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, [1, 2], 0);
      expect(callback).toHaveBeenNthCalledWith(2, [3, 4], 2);
      expect(callback).toHaveBeenNthCalledWith(3, [5], 4);
    });

    it('should handle empty array', () => {
      const callback = jest.fn();
      chunkedIterator([], 2, callback);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('estimateMemorySize', () => {
    it('should estimate size of object', () => {
      const size = estimateMemorySize({ test: 'value' });
      expect(size).toBeGreaterThan(0);
    });

    it('should estimate size of array', () => {
      const size = estimateMemorySize([1, 2, 3]);
      expect(size).toBeGreaterThan(0);
    });

    it('should handle nested objects', () => {
      const size = estimateMemorySize({ nested: { data: [1, 2, 3] } });
      expect(size).toBeGreaterThan(0);
    });
  });
});