import { render, screen, fireEvent } from '@testing-library/react';
import AuthStatus from './AuthStatus';

beforeEach(() => {
  delete window.location;
  window.location = { href: '' };
});

afterEach(() => {
  jest.resetAllMocks();
});

test('shows loading state initially', () => {
  global.fetch = jest.fn(() => new Promise(() => {})); // never resolves
  render(<AuthStatus />);
  expect(screen.getByText(/Loading/i)).toBeInTheDocument();
});

test('shows login button when unauthenticated', async () => {
  global.fetch = jest.fn().mockResolvedValue({ status: 401, ok: false });
  render(<AuthStatus />);
  const button = await screen.findByText(/Sign in with Google/i);
  expect(button).toBeInTheDocument();
});

test('shows user email when authenticated', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: async () => ({ userId: '123', email: 'test@example.com' }),
  });
  render(<AuthStatus />);
  expect(await screen.findByText(/test@example\.com/)).toBeInTheDocument();
  expect(screen.getByText(/Sign out/i)).toBeInTheDocument();
});

test('login button redirects to backend auth endpoint', async () => {
  global.fetch = jest.fn().mockResolvedValue({ status: 401, ok: false });
  render(<AuthStatus />);
  const button = await screen.findByText(/Sign in with Google/i);
  fireEvent.click(button);
  expect(window.location.href).toContain('/auth/google');
});

test('logout button calls backend and clears user', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({ userId: '123', email: 'test@example.com' }),
    })
    .mockResolvedValueOnce({ ok: true });

  render(<AuthStatus />);
  await screen.findByText(/test@example\.com/);

  const signOutBtn = screen.getByText(/Sign out/i);
  fireEvent.click(signOutBtn);

  expect(await screen.findByText(/Sign in with Google/i)).toBeInTheDocument();
});

test('shows error message on fetch failure', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
  render(<AuthStatus />);
  expect(await screen.findByText(/Error: Network error/i)).toBeInTheDocument();
});
