import { json } from '../utils/response.js';

export async function handleAuth(request) {
  const { DB } = request.env;
  
  try {
    switch (request.method) {
      case 'POST':
        if (request.url.includes('/auth/google')) {
          // Google auth - in a real implementation, you would verify the Google token
          // and get user info from Google's API
          const { googleId, name, email, avatar } = await request.json();
          
          // Check if user already exists
          let user = await DB.prepare(
            "SELECT * FROM users WHERE email = ?"
          ).bind(email).first();
          
          // Create user if they don't exist
          if (!user) {
            const userId = 'user_' + Math.random().toString(36).substr(2, 9);
            const createdAt = new Date().toISOString();
            
            await DB.prepare(`
              INSERT INTO users (id, name, email, avatar, createdAt)
              VALUES (?, ?, ?, ?, ?)
            `).bind(userId, name, email, avatar, createdAt).run();
            
            user = { id: userId, name, email, avatar, createdAt };
          }
          
          // Create session
          const sessionToken = 'session_' + Math.random().toString(36).substr(2, 20);
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
          
          await DB.prepare(`
            INSERT INTO sessions (token, userId, expiresAt)
            VALUES (?, ?, ?)
          `).bind(sessionToken, user.id, expiresAt.toISOString()).run();
          
          return json({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar
            },
            token: sessionToken,
            expiresAt: expiresAt.toISOString()
          });
        } else if (request.url.includes('/auth/logout')) {
          const authHeader = request.headers.get('Authorization');
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            await DB.prepare(
              "DELETE FROM sessions WHERE token = ?"
            ).bind(token).run();
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
          const session = await DB.prepare(
            "SELECT s.*, u.id as userId, u.name, u.email, u.avatar FROM sessions s JOIN users u ON s.userId = u.id WHERE s.token = ?"
          ).bind(token).first();
          
          if (!session) {
            return new Response('Session expired', { status: 401 });
          }
          
          // Check if session has expired
          const expiresAt = new Date(session.expiresAt).getTime();
          if (expiresAt < Date.now()) {
            // Delete expired session
            await DB.prepare(
              "DELETE FROM sessions WHERE token = ?"
            ).bind(token).run();
            return new Response('Session expired', { status: 401 });
          }
          
          const user = {
            id: session.userId,
            name: session.name,
            email: session.email,
            avatar: session.avatar
          };
          
          return json({ user });
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