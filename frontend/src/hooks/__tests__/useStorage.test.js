import { renderHook, act, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { useAuth } from '../useAuth';
import { usePhotos } from '../usePhotos';
import { useStorageConnections } from '../useStorageConnections';

// Mock modules
jest.mock('../services/api');
jest.mock('../utils/indexedDB');

describe('useAuth hook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });
});

describe('usePhotos hook', () => {
  it('should initialize with empty photos', () => {
    const { result } = renderHook(() => usePhotos());
    
    expect(result.current.photos).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useStorageConnections hook', () => {
  it('should initialize with no connections', () => {
    const { result } = renderHook(() => useStorageConnections());
    
    expect(result.current.connections).toEqual({});
    expect(result.current.isConnecting).toBe(false);
    expect(typeof result.current.connectProvider).toBe('function');
    expect(typeof result.current.disconnectProvider).toBe('function');
  });
});