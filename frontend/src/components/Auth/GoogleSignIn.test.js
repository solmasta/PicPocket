import { render, screen, fireEvent } from '@testing-library/react';
import GoogleSignIn from './GoogleSignIn';

describe('GoogleSignIn', () => {
  test('clicking "Use Pic-Pocket Locally" calls continueLocally, not a page reload', () => {
    const continueLocally = jest.fn();
    render(<GoogleSignIn signIn={jest.fn()} continueLocally={continueLocally} loading={false} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: /use pic-pocket locally/i }));

    expect(continueLocally).toHaveBeenCalledTimes(1);
  });

  test('clicking "Sign in with Google" calls signIn', () => {
    const signIn = jest.fn();
    render(<GoogleSignIn signIn={signIn} continueLocally={jest.fn()} loading={false} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));

    expect(signIn).toHaveBeenCalledTimes(1);
  });
});
