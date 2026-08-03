import { render, screen } from '@testing-library/react';
import PhotoUpload from './PhotoUpload';

describe('PhotoUpload cloud backup options', () => {
  test('disables backup checkboxes and shows a hint for a user without Google Drive/Photos access', () => {
    render(<PhotoUpload onUpload={jest.fn()} user={{ isLocal: true }} />);

    expect(screen.getByLabelText(/backup to google drive/i).disabled).toBe(true);
    expect(screen.getByLabelText(/backup to google photos/i).disabled).toBe(true);
    expect(
      screen.getByText(/sign in with google and grant drive\/photos access/i)
    ).not.toBeNull();
  });

  test('enables backup checkboxes for a user with Drive/Photos scope granted', () => {
    render(
      <PhotoUpload
        onUpload={jest.fn()}
        user={{
          accessToken: 'test-token',
          scope: 'openid profile email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/photoslibrary.appendonly',
        }}
      />
    );

    expect(screen.getByLabelText(/backup to google drive/i).disabled).toBe(false);
    expect(screen.getByLabelText(/backup to google photos/i).disabled).toBe(false);
    expect(
      screen.queryByText(/sign in with google and grant drive\/photos access/i)
    ).toBeNull();
  });

  test('OneDrive/Dropbox checkboxes are disabled until those are connected in Settings', () => {
    render(
      <PhotoUpload
        onUpload={jest.fn()}
        user={{ isLocal: true }}
        storageConnections={{ connections: { onedrive: null, dropbox: null } }}
      />
    );

    expect(screen.getByLabelText(/backup to onedrive/i).disabled).toBe(true);
    expect(screen.getByLabelText(/backup to dropbox/i).disabled).toBe(true);
    expect(screen.getByText(/connect onedrive\/dropbox in settings/i)).not.toBeNull();
  });

  test('OneDrive/Dropbox checkboxes enable once connected, independent of Google', () => {
    render(
      <PhotoUpload
        onUpload={jest.fn()}
        user={{ isLocal: true }}
        storageConnections={{
          connections: {
            onedrive: { accessToken: 'od-token', accountName: 'Daughter OneDrive' },
            dropbox: { accessToken: 'db-token', accountName: 'Daughter Dropbox' },
          },
        }}
      />
    );

    expect(screen.getByLabelText(/backup to onedrive/i).disabled).toBe(false);
    expect(screen.getByLabelText(/backup to dropbox/i).disabled).toBe(false);
    // Google is still not connected for this (local) user.
    expect(screen.getByLabelText(/backup to google drive/i).disabled).toBe(true);
  });
});
