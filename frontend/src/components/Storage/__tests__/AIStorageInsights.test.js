import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIStorageInsights from '../AIStorageInsights';

const mockStats = {
  totalPhotos: 100,
  totalBytes: 1024 * 1024 * 500,
  backedUpNowhere: 10,
  perProvider: {
    googleDrive: 30,
    dropbox: 20,
    oneDrive: 15
  },
  duplicateGroups: 5,
  duplicateWastedBytes: 1024 * 1024 * 50
};

describe('AIStorageInsights', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch.mockRestore();
  });

  it('should render loading state initially', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    
    render(<AIStorageInsights stats={mockStats} />);
    
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  it('should render stats summary', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        summary: 'Test summary',
        recommendations: ['Test recommendation']
      })
    });

    render(<AIStorageInsights stats={mockStats} />);

    await waitFor(() => {
      expect(screen.getByText(/100/)).toBeInTheDocument();
    });
  });

  it('should display recommendations', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        summary: 'Test summary',
        recommendations: ['Clear duplicates', 'Backup photos']
      })
    });

    render(<AIStorageInsights stats={mockStats} />);

    await waitFor(() => {
      expect(screen.getByText('Clear duplicates')).toBeInTheDocument();
    });
  });

  it('should show offline fallback on error', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    render(<AIStorageInsights stats={mockStats} />);

    await waitFor(() => {
      const fallback = screen.getByText(/offline/i);
      expect(fallback).toBeInTheDocument();
    });
  });

  it('should handle empty stats', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        summary: 'No photos yet',
        recommendations: []
      })
    });

    render(<AIStorageInsights stats={{}} />);

    await waitFor(() => {
      expect(screen.getByText(/No photos/)).toBeInTheDocument();
    });
  });
});