import { render, screen, fireEvent } from '@testing-library/react';
import Settings from './Settings';

test('renders Settings heading', () => {
  render(<Settings />);
  expect(screen.getByText('Settings')).toBeInTheDocument();
});

test('toggles Google Photos checkbox', () => {
  render(<Settings />);
  const checkbox = screen.getByLabelText('Google Photos');
  expect(checkbox.checked).toBe(false);
  fireEvent.click(checkbox);
  expect(checkbox.checked).toBe(true);
});

test('toggles Google Drive checkbox', () => {
  render(<Settings />);
  const checkbox = screen.getByLabelText('Google Drive');
  expect(checkbox.checked).toBe(false);
  fireEvent.click(checkbox);
  expect(checkbox.checked).toBe(true);
});

test('Auto Backup disabled when no integration enabled', () => {
  render(<Settings />);
  const autoBackup = screen.getByLabelText('Auto Backup');
  expect(autoBackup).toBeDisabled();
  expect(screen.getByText(/Enable Google Photos or Drive first/i)).toBeInTheDocument();
});

test('Auto Backup enabled after enabling Google Photos', () => {
  render(<Settings />);
  fireEvent.click(screen.getByLabelText('Google Photos'));
  const autoBackup = screen.getByLabelText('Auto Backup');
  expect(autoBackup).not.toBeDisabled();
});

test('saves horse profile', () => {
  render(<Settings />);
  const nameInput = screen.getByPlaceholderText('Enter horse name');
  const breedInput = screen.getByPlaceholderText('Enter horse breed');
  const saveBtn = screen.getByText('Save Horse Profile');

  expect(saveBtn).toBeDisabled();

  fireEvent.change(nameInput, { target: { value: 'Spirit' } });
  fireEvent.change(breedInput, { target: { value: 'Mustang' } });

  expect(saveBtn).not.toBeDisabled();
  fireEvent.click(saveBtn);

  expect(screen.getByText('Spirit')).toBeInTheDocument();
  expect(screen.getByText('Mustang')).toBeInTheDocument();
});
