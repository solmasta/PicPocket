import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIStorageInsights from './AIStorageInsights';
import { getStorageInsights } from '../../services/aiService';

jest.mock('../../services/aiService');

const basePhoto = (overrides) => ({
  id: 'id',
  fileName: 'a.jpg',
  fileSize: 1024,
  uploadDate: '2024-01-01T00:00:00.000Z',
  tags: [],
  cloudBackup: {},
  thumbnail: 'data:image/jpeg;base64,thumb',
  ...overrides,
});

describe('AIStorageInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when there are no photos', () => {
    const { container } = render(<AIStorageInsights photos={[]} onDelete={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  test('fetches and displays an AI summary and recommendations on mount', async () => {
    getStorageInsights.mockResolvedValue({
      summary: 'You have 2 photos taking up 2 KB.',
      recommendations: ['Back up your photos.'],
      source: 'ai',
    });

    render(
      <AIStorageInsights
        photos={[basePhoto({ id: '1' }), basePhoto({ id: '2', fileName: 'b.jpg' })]}
        onDelete={jest.fn()}
      />
    );

    expect(await screen.findByText('You have 2 photos taking up 2 KB.')).not.toBeNull();
    expect(screen.getByText('Back up your photos.')).not.toBeNull();
    expect(getStorageInsights).toHaveBeenCalledWith(
      expect.objectContaining({ totalPhotos: 2, backedUpNowhere: 2 })
    );
  });

  test('shows a fallback note when the insights did not come from AI', async () => {
    getStorageInsights.mockResolvedValue({
      summary: 'Local summary.',
      recommendations: [],
      source: 'offline',
    });

    render(<AIStorageInsights photos={[basePhoto()]} onDelete={jest.fn()} />);

    expect(await screen.findByText(/AI wasn't reachable/i)).not.toBeNull();
  });

  test('groups exact duplicates by contentHash and cleans them up, keeping one', async () => {
    getStorageInsights.mockResolvedValue({ summary: 's', recommendations: [], source: 'ai' });
    const onDelete = jest.fn().mockResolvedValue();

    const photos = [
      basePhoto({ id: '1', fileName: 'dup1.jpg', contentHash: 'hash-a', uploadDate: '2024-01-01T00:00:00.000Z' }),
      basePhoto({ id: '2', fileName: 'dup2.jpg', contentHash: 'hash-a', uploadDate: '2024-02-01T00:00:00.000Z' }),
      basePhoto({ id: '3', fileName: 'unique.jpg', contentHash: 'hash-b' }),
    ];

    render(<AIStorageInsights photos={photos} onDelete={onDelete} />);

    expect(await screen.findByText(/2 copies of dup1.jpg/)).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /keep 1, delete 1/i }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('2'));
    expect(onDelete).not.toHaveBeenCalledWith('1');
    await waitFor(() => expect(screen.queryByText(/cleaning up/i)).toBeNull());
  });
});
