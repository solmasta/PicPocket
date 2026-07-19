import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders sign-in form on load', () => {
  render(<App />);
  expect(screen.getByText(/PicPocket/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});

test('shows gallery after signing in', async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'secret');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/search photos/i)).toBeInTheDocument();
});

test('returns to sign-in after signing out', async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'secret');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
});

