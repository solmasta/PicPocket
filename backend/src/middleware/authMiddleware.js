import { json } from 'itty-router-extras';

export async function verifyAuth(request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: new Response('Unauthorized', { status: 401 }) };
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  // Verify token against database
  try {
    const { DB } = request.env;
    const session = await DB.prepare(
      "SELECT s.*, u.id as userId, u.name, u.email, u.avatar FROM sessions s JOIN users u ON s.userId = u.id WHERE s.token = ?"
    ).bind(token).first();
    
    if (!session) {
      return { error: new Response('Session expired', { status: 401 }) };
    }
    
    // Check if session has expired
    const expiresAt = new Date(session.expiresAt).getTime();
    if (expiresAt < Date.now()) {
      // Delete expired session
      await DB.prepare(
        "DELETE FROM sessions WHERE token = ?"
      ).bind(token).run();
      return { error: new Response('Session expired', { status: 401 }) };
    }
    
    // Refresh token if it's expiring soon (within 5 minutes)
    if (expiresAt - Date.now() < 5 * 60 * 1000) {
      const newExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      await DB.prepare(
        "UPDATE sessions SET expiresAt = ? WHERE token = ?"
      ).bind(newExpiresAt.toISOString(), token).run();
    }
    
    const user = {
      id: session.userId,
      name: session.name,
      email: session.email,
      avatar: session.avatar
    };
    
    return { user };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { error: new Response('Internal server error', { status: 500 }) };
  }
}

export async function authMiddleware(request, env) {
  const authResult = await verifyAuth(request);
  
  if (authResult.error) {
    return authResult.error;
  }
  
  request.user = authResult.user;
  request.env = env; // Pass env to request for database access
}