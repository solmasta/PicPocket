export async function verifyAuth(request) {
  const { env } = request;
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: new Response('Unauthorized', { status: 401 }) };
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  // Verify token against database
  try {
    const session = await env.DB.prepare(
      "SELECT s.*, u.id as userId, u.name, u.email, u.avatar FROM sessions s JOIN users u ON s.userId = u.id WHERE s.token = ?"
    ).bind(token).first();
    
    if (!session) {
      return { error: new Response('Invalid session', { status: 401 }) };
    }
    
    // Check if session has expired
    const expiresAt = new Date(session.expiresAt).getTime();
    if (expiresAt < Date.now()) {
      // Delete expired session
      await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
      return { error: new Response('Session expired', { status: 401 }) };
    }
    
    // Refresh token if it's expiring soon (within 5 minutes)
    if (expiresAt - Date.now() < 5 * 60 * 1000) {
      const newExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
      await env.DB.prepare(
        "UPDATE sessions SET expiresAt = ? WHERE token = ?"
      ).bind(newExpiresAt, token).run();
    }
    
    const user = {
      id: session.userId,
      name: session.name,
      email: session.email,
      avatar: session.avatar
    };
    
    return { user };
  } catch (error) {
    console.error('Auth error:', error);
    return { error: new Response('Authentication error', { status: 500 }) };
  }
}

export async function authMiddleware(request) {
  const authResult = await verifyAuth(request);

  if (authResult.error) {
    return authResult.error;
  }

  request.user = authResult.user;
}