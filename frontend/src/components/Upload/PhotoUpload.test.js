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
});
