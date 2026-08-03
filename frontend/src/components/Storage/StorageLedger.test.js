import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StorageLedger from './StorageLedger';
import { listDriveFiles } from '../../services/googleDriveService';
import { listGooglePhotos } from '../../services/googlePhotosService';

jest.mock('../../services/googleDriveService');
jest.mock('../../services/googlePhotosService');

const GOOGLE_USER = {
  id: 'u1',
  accessToken: 'test-token',
  scope: 'openid profile email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/photoslibrary.appendonly',
};

const photos = [
  { id: 'p1', fileName: 'a.jpg', cloudBackup: { googleDrive: 'drive-1', googlePhotos: null } },
  { id: 'p2', fileName: 'b.jpg', cloudBackup: { googleDrive: null, googlePhotos: null } },
];

describe('StorageLedger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('local-only user sees local counts and a disabled reconcile button', () => {
    render(<StorageLedger photos={photos} user={{ isLocal: true }} />);

    expect(screen.getByText('2')).not.toBeNull(); // total local
    const button = screen.getByRole('button', { name: /check cloud storage/i });
    expect(button.disabled).toBe(true);
  });

  test('reconciling flags a locally-marked backup that is missing from Drive', async () => {
    listDriveFiles.mockResolvedValue([]); // drive-1 is NOT present remotely
    listGooglePhotos.mockResolvedValue({ items: [], nextPageToken: undefined });

    render(<StorageLedger photos={photos} user={GOOGLE_USER} />);

    fireEvent.click(screen.getByRole('button', { name: /check cloud storage/i }));

    await waitFor(() => expect(listDriveFiles).toHaveBeenCalledWith('test-token'));
    expect(await screen.findByText(/missing remotely/i)).not.toBeNull();
  });

  test('reconciling surfaces an orphaned Drive file not tracked by any local photo', async () => {
    listDriveFiles.mockResolvedValue([
      { id: 'drive-1', name: 'a.jpg', webViewLink: 'https://drive.example/a' },
      { id: 'drive-orphan', name: 'from-another-device.jpg', webViewLink: 'https://drive.example/orphan' },
    ]);
    listGooglePhotos.mockResolvedValue({ items: [], nextPageToken: undefined });

    render(<StorageLedger photos={photos} user={GOOGLE_USER} />);
    fireEvent.click(screen.getByRole('button', { name: /check cloud storage/i }));

    expect(await screen.findByText('from-another-device.jpg')).not.toBeNull();
  });
});
