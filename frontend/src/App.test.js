import { render, screen } from '@testing-library/react';
import App from './App';

test('renders PicPocket header', () => {
  render(<App />);
  expect(screen.getByText(/PicPocket/i)).toBeInTheDocument();
});

test('renders navigation tabs', () => {
  render(<App />);
  expect(screen.getAllByText(/Collage/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Filters/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Horse Profile/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Stories/i).length).toBeGreaterThan(0);
});
