import { json, error, ErrorCodes } from '../utils/response.js';

export async function handleAuth(request) {
  const { DB } = request.env;

  try {
    switch (request.method) {
      case 'POST':
        if (request.url.includes('/auth/google')) {
          const { googleId, name, email, avatar } = await request.json();

          if (!email) {
            return error('Email is required', 400, ErrorCodes.BAD_REQUEST.code);
          }

          let user = await DB.prepare(
            "SELECT * FROM users WHERE email = ?"
          ).bind(email).first();

          if (!user) {
            const userId = 'user_' + crypto.randomUUID().slice(0, 12);
            const createdAt = new Date().toISOString();

            await DB.prepare(`
              INSERT INTO users (id, name, email, avatar, createdAt)
              VALUES (?, ?, ?, ?, ?)
            `).bind(userId, name, email, avatar, createdAt).run();

            user = { id: userId, name, email, avatar, createdAt };
          }

          const sessionToken = 'session_' + crypto.randomUUID().replace(/-/g, '');
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

          await DB.prepare(`
            INSERT INTO sessions (token, userId, expiresAt)
            VALUES (?, ?, ?)
          `).bind(sessionToken, user.id, expiresAt.toISOString()).run();

          return json({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
            },
            token: sessionToken,
            expiresAt: expiresAt.toISOString(),
          });
        }

        if (request.url.includes('/auth/logout')) {
          const authHeader = request.headers.get('Authorization');
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            await DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
          }
          return json({ message: 'Logged out successfully' });
        }
        break;

      case 'GET':
        if (request.url.includes('/auth/verify')) {
          const authHeader = request.headers.get('Authorization');

          if (!authHeader?.startsWith('Bearer ')) {
            return error('Unauthorized', 401, ErrorCodes.UNAUTHORIZED.code);
          }

          const token = authHeader.slice(7);
          const session = await DB.prepare(
            "SELECT s.*, u.id as userId, u.name, u.email, u.avatar FROM sessions s JOIN users u ON s.userId = u.id WHERE s.token = ?"
          ).bind(token).first();

          if (!session) {
            return error('Session expired', 401, ErrorCodes.UNAUTHORIZED.code);
          }

          if (new Date(session.expiresAt).getTime() < Date.now()) {
            await DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
            return error('Session expired', 401, ErrorCodes.UNAUTHORIZED.code);
          }

          return json({
            user: {
              id: session.userId,
              name: session.name,
              email: session.email,
              avatar: session.avatar,
            },
          });
        }
        break;

      default:
        return error('Method not allowed', 405, ErrorCodes.BAD_REQUEST.code);
    }
  } catch (err) {
    console.error('Auth error:', err);
    return error('Authentication failed', 500, ErrorCodes.INTERNAL_ERROR.code);
  }
}

export default { handleAuth };