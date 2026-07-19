import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Fetches the current authenticated user from the backend.
 * Returns null if the user is not logged in.
 */
async function fetchCurrentUser() {
  const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

/**
 * Logs the user out by calling the backend logout endpoint.
 * The backend revokes Google tokens and destroys the server-side session.
 * No tokens are ever stored or cleared on the frontend.
 */
async function logout() {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export default function AuthStatus() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = () => {
    // Redirect to backend OAuth flow — tokens are handled entirely server-side.
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;

  if (!user) {
    return (
      <div>
        <p>You are not logged in.</p>
        <button onClick={handleLogin}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div>
      <p>Signed in as <strong>{user.email}</strong></p>
      <button onClick={handleLogout}>Sign out</button>
    </div>
  );
}
