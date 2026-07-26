import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { usePhotos } from '../hooks/usePhotos';

jest.mock('../hooks/usePhotos');

const mockLoginTrigger = jest.fn();

jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }) => children,
  useGoogleLogin: () => mockLoginTrigger,
}));

describe('Google sign-in button wiring', () => {
  const originalClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REACT_APP_GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    usePhotos.mockReturnValue({
      photos: [],
      addPhoto: jest.fn(),
      deletePhoto: jest.fn(),
      updatePhoto: jest.fn(),
      loading: false,
    });
  });

  afterEach(() => {
    process.env.REACT_APP_GOOGLE_CLIENT_ID = originalClientId;
  });

  test('clicking "Sign in with Google" invokes the Google login trigger', async () => {
    render(<App />);

    const button = await screen.findByRole('button', { name: /sign in with google/i });
    fireEvent.click(button);

    await waitFor(() => expect(mockLoginTrigger).toHaveBeenCalledTimes(1));
  });
});
