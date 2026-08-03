import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StorageLedger from './StorageLedger';
import { listDriveFiles, downloadDriveFile } from '../../services/googleDriveService';
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
    render(<StorageLedger photos={photos} user={{ isLocal: true }} onImport={jest.fn()} onImportBackupTag={jest.fn()} />);

    expect(screen.getByText('2')).not.toBeNull(); // total local
    const button = screen.getByRole('button', { name: /check cloud storage/i });
    expect(button.disabled).toBe(true);
  });

  test('reconciling flags a locally-marked backup that is missing from Drive', async () => {
    listDriveFiles.mockResolvedValue([]); // drive-1 is NOT present remotely
    listGooglePhotos.mockResolvedValue({ items: [], nextPageToken: undefined });

    render(<StorageLedger photos={photos} user={GOOGLE_USER} onImport={jest.fn()} onImportBackupTag={jest.fn()} />);

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

    render(<StorageLedger photos={photos} user={GOOGLE_USER} onImport={jest.fn()} onImportBackupTag={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /check cloud storage/i }));

    expect(await screen.findByText('from-another-device.jpg')).not.toBeNull();
  });

  test('"Add to This Device" downloads an orphaned Drive file, imports it, tags it as backed up, and removes it from the orphan list', async () => {
    listDriveFiles.mockResolvedValue([
      { id: 'drive-orphan', name: 'from-another-device.jpg', webViewLink: 'https://drive.example/orphan', mimeType: 'image/jpeg' },
    ]);
    listGooglePhotos.mockResolvedValue({ items: [], nextPageToken: undefined });
    downloadDriveFile.mockResolvedValue(new Blob(['bytes'], { type: 'image/jpeg' }));

    const importedPhoto = { id: 'new-local-id', fileName: 'from-another-device.jpg', cloudBackup: {} };
    const onImport = jest.fn().mockResolvedValue(importedPhoto);
    const onImportBackupTag = jest.fn().mockResolvedValue(undefined);

    render(
      <StorageLedger
        photos={photos}
        user={GOOGLE_USER}
        onImport={onImport}
        onImportBackupTag={onImportBackupTag}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /check cloud storage/i }));
    await screen.findByText('from-another-device.jpg');

    fireEvent.click(screen.getByRole('button', { name: /add to this device/i }));

    await waitFor(() => expect(onImport).toHaveBeenCalled());
    const [fileArg] = onImport.mock.calls[0];
    expect(fileArg.name).toBe('from-another-device.jpg');

    await waitFor(() =>
      expect(onImportBackupTag).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'new-local-id', cloudBackup: expect.objectContaining({ googleDrive: 'drive-orphan' }) })
      )
    );

    // The orphan entry disappears once imported.
    await waitFor(() => expect(screen.queryByText('from-another-device.jpg')).toBeNull());
  });

  test('a failed import shows an inline error instead of crashing', async () => {
    listDriveFiles.mockResolvedValue([
      { id: 'drive-orphan', name: 'broken.jpg', webViewLink: 'https://drive.example/orphan', mimeType: 'image/jpeg' },
    ]);
    listGooglePhotos.mockResolvedValue({ items: [], nextPageToken: undefined });
    downloadDriveFile.mockRejectedValue(new Error('Failed to download file from Google Drive'));

    render(
      <StorageLedger
        photos={photos}
        user={GOOGLE_USER}
        onImport={jest.fn()}
        onImportBackupTag={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /check cloud storage/i }));
    await screen.findByText('broken.jpg');

    fireEvent.click(screen.getByRole('button', { name: /add to this device/i }));

    expect(await screen.findByText(/failed to download file from google drive/i)).not.toBeNull();
    // Still listed as an orphan since the import didn't succeed.
    expect(screen.queryByText('broken.jpg')).not.toBeNull();
  });
});
