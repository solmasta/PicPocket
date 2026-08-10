import { json } from 'itty-router-extras';

// In-memory store for demo purposes - replace with database in production
const sessionStore = new Map();
const userStore = new Map();

export async function handleAuth(request) {
  try {
    switch (request.method) {
      case 'POST':
        if (request.url.includes('/auth/google')) {
          // Google auth simulation
          const { token } = await request.json();
          
          // In a real implementation, you would verify the Google token
          // and get user info from Google's API
          
          // For demo purposes, we'll create a mock user
          const mockUser = {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            name: 'Demo User',
            email: 'demo@example.com',
            avatar: 'https://placehold.co/100x100'
          };
          
          // Store user (in production, store in database)
          userStore.set(mockUser.id, mockUser);
          
          // Create session
          const sessionToken = 'session_' + Math.random().toString(36).substr(2, 20);
          const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
          
          const session = {
            user: mockUser,
            expiresAt
          };
          
          // Store session (in production, store in database)
          sessionStore.set(sessionToken, session);
          
          return json({
            user: mockUser,
            token: sessionToken,
            expiresAt
          });
        } else if (request.url.includes('/auth/logout')) {
          const authHeader = request.headers.get('Authorization');
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            sessionStore.delete(token);
          }
          return json({ message: 'Logged out successfully' });
        }
        break;
        
      case 'GET':
        if (request.url.includes('/auth/verify')) {
          const authHeader = request.headers.get('Authorization');
          
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response('Unauthorized', { status: 401 });
          }
          
          const token = authHeader.slice(7);
          const session = sessionStore.get(token);
          
          if (!session) {
            return new Response('Session expired', { status: 401 });
          }
          
          // Check if session has expired
          if (session.expiresAt < Date.now()) {
            sessionStore.delete(token);
            return new Response('Session expired', { status: 401 });
          }
          
          return json({ user: session.user });
        }
        break;
        
      default:
        return json({ error: 'Method not allowed' }, 405);
    }
  } catch (error) {
    console.error('Auth error:', error);
    return json({ error: 'Authentication failed' }, 500);
  }
}