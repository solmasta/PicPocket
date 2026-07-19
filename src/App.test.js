import { render, screen } from '@testing-library/react';
import App from './App';

test('renders sign in form when not authenticated', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});

test('renders email and password fields', () => {
  render(<App />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
