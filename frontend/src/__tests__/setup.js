import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

expect.extend({
  toBeInTheDocument() {
    return {
      pass: this.actual !== null,
      message: () => `Expected element ${this.isNot ? 'not ' : ''}to be in the document`,
    };
  },
});

afterEach(() => {
  cleanup();
});

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();