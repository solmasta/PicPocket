import { render, screen } from '@testing-library/react';
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

  // Scope to the nav buttons themselves — "Gallery" also appears in the
  // empty-gallery placeholder text ("Your gallery is empty"), which would
  // otherwise make these queries ambiguous.
  expect(screen.getByRole('button', { name: 'Gallery' })).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Collage Maker' })).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Filters' })).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Horse Profile' })).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Photo Stories' })).not.toBeNull();
});
