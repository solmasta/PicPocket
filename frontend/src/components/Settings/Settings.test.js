import { render, screen, fireEvent } from '@testing-library/react';
import Settings from './Settings';

describe('Settings storage connections', () => {
  test('shows "Not set up yet" for a provider with no Client ID configured', () => {
    render(
      <Settings
        user={{ isLocal: true }}
        storageConnections={{
          connections: { onedrive: null, dropbox: null },
          connecting: null,
          errors: {},
          connect: jest.fn(),
          disconnect: jest.fn(),
          isOneDriveConfigured: false,
          isDropboxConfigured: false,
        }}
      />
    );

    expect(screen.getAllByText(/not set up yet/i).length).toBe(2);
  });

  test('a configured, unconnected provider shows a working Connect button', () => {
    const connect = jest.fn();
    render(
      <Settings
        user={{ isLocal: true }}
        storageConnections={{
          connections: { onedrive: null, dropbox: null },
          connecting: null,
          errors: {},
          connect,
          disconnect: jest.fn(),
          isOneDriveConfigured: true,
          isDropboxConfigured: false,
        }}
      />
    );

    const connectBtn = screen.getByRole('button', { name: /^connect$/i });
    fireEvent.click(connectBtn);
    expect(connect).toHaveBeenCalledWith('onedrive');
  });

  test('a connected provider shows the account name and a Disconnect button', () => {
    const disconnect = jest.fn();
    render(
      <Settings
        user={{ isLocal: true }}
        storageConnections={{
          connections: { onedrive: { accountName: 'Daughter OneDrive' }, dropbox: null },
          connecting: null,
          errors: {},
          connect: jest.fn(),
          disconnect,
          isOneDriveConfigured: true,
          isDropboxConfigured: false,
        }}
      />
    );

    expect(screen.getByText('Daughter OneDrive')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /disconnect/i }));
    expect(disconnect).toHaveBeenCalledWith('onedrive');
  });

  test('an existing connection always shows Disconnect, even if isConfigured later reports false (e.g. Client ID env var removed)', () => {
    const disconnect = jest.fn();
    render(
      <Settings
        user={{ isLocal: true }}
        storageConnections={{
          connections: { onedrive: { accountName: 'Daughter OneDrive' }, dropbox: null },
          connecting: null,
          errors: {},
          connect: jest.fn(),
          disconnect,
          isOneDriveConfigured: false,
          isDropboxConfigured: false,
        }}
      />
    );

    // Dropbox (unconnected, unconfigured) still legitimately shows the
    // "not set up" message — only OneDrive (connected) should not.
    expect(screen.getAllByText(/not set up yet/i).length).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: /disconnect/i }));
    expect(disconnect).toHaveBeenCalledWith('onedrive');
  });

  test('shows a connection error inline', () => {
    render(
      <Settings
        user={{ isLocal: true }}
        storageConnections={{
          connections: { onedrive: null, dropbox: null },
          connecting: null,
          errors: { onedrive: 'Popup blocked.' },
          connect: jest.fn(),
          disconnect: jest.fn(),
          isOneDriveConfigured: true,
          isDropboxConfigured: true,
        }}
      />
    );

    expect(screen.getByText(/popup blocked/i)).not.toBeNull();
  });
});
