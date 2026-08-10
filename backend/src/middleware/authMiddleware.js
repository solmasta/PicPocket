import { json } from 'itty-router-extras';

// In-memory store for demo purposes - replace with database in production
const sessionStore = new Map();

export async function verifyAuth(request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: new Response('Unauthorized', { status: 401 }) };
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  // In production, verify token against database
  // For now, we'll use in-memory store for demo
  const session = sessionStore.get(token);
  
  if (!session) {
    return { error: new Response('Session expired', { status: 401 }) };
  }
  
  // Check if session has expired
  if (session.expiresAt < Date.now()) {
    sessionStore.delete(token);
    return { error: new Response('Session expired', { status: 401 }) };
  }
  
  // Refresh token if it's expiring soon (within 5 minutes)
  if (session.expiresAt - Date.now() < 5 * 60 * 1000) {
    const newExpiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now
    session.expiresAt = newExpiresAt;
    
    // In production, update session in database
    // sessionStore.set(token, session); // Already updated since it's a reference
  }
  
  return { user: session.user };
}

export async function authMiddleware(request, env) {
  const authResult = await verifyAuth(request);
  
  if (authResult.error) {
    return authResult.error;
  }
  
  request.user = authResult.user;
  request.env = env; // Pass env to request for database access
}