import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    status: 401,
    ok: false,
    json: async () => ({ error: 'Not authenticated' }),
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders PicPocket heading', () => {
  render(<App />);
  expect(screen.getByText(/PicPocket/i)).toBeInTheDocument();
});

test('shows login button when not authenticated', async () => {
  render(<App />);
  const button = await screen.findByText(/Sign in with Google/i);
  expect(button).toBeInTheDocument();
});

