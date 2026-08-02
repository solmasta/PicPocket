import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { useAuth } from './hooks/useAuth';
import { usePhotos } from './hooks/usePhotos';

jest.mock('./hooks/useAuth');
jest.mock('./hooks/usePhotos');

const signedInUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://example.com/avatar.png',
};

beforeEach(() => {
  jest.clearAllMocks();
  usePhotos.mockReturnValue({
    photos: [],
    addPhoto: jest.fn(),
    deletePhoto: jest.fn(),
    updatePhoto: jest.fn(),
    loading: false,
  });
});

test('renders Google sign-in screen when signed out', () => {
  useAuth.mockReturnValue({
    user: null,
    loading: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
  });

  render(<App />);

  expect(screen.getByRole('heading', { name: /pic-pocket/i })).not.toBeNull();
  expect(screen.getByRole('button', { name: /sign in with google/i })).not.toBeNull();
});

test('renders navigation tabs when signed in', () => {
  useAuth.mockReturnValue({
    user: signedInUser,
    loading: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
  });

  render(<App />);

  expect(screen.getByText(/gallery/i)).not.toBeNull();
  expect(screen.getByText(/collage maker/i)).not.toBeNull();
  expect(screen.getByText(/filters/i)).not.toBeNull();
  expect(screen.getByText(/horse profile/i)).not.toBeNull();
  expect(screen.getByText(/photo stories/i)).not.toBeNull();
});

test('pressing browser back steps back through views instead of leaving the app', () => {
  useAuth.mockReturnValue({
    user: signedInUser,
    loading: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
  });

  render(<App />);

  fireEvent.click(screen.getByTitle('Settings'));
  expect(screen.getByRole('heading', { name: /settings/i })).not.toBeNull();

  // Simulate the browser/hardware back button: it should pop the pushed
  // "settings" history entry and return to the gallery view within the
  // app, rather than the whole app unmounting/closing.
  fireEvent.popState(window);

  expect(screen.queryByRole('heading', { name: /settings/i })).toBeNull();
  expect(screen.getByText(/collage maker/i)).not.toBeNull();
  // Still signed in — the sign-in screen never reappears.
  expect(screen.queryByRole('button', { name: /sign in with google/i })).toBeNull();
});
