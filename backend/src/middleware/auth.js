import { Router, withParams } from 'itty-router';
import { verifyToken } from '../services/auth';

export const authMiddleware = withParams;

export const requireAuth = async (request, env) => {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      error: 'Missing or invalid authorization header',
      code: 'UNAUTHORIZED'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const payload = await verifyToken(token, env);
    
    if (!payload) {
      return new Response(JSON.stringify({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    return null;
  } catch (err) {
    console.error('Auth verification failed:', err);
    return new Response(JSON.stringify({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const optionalAuth = async (request, env) => {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    request.user = null;
    return null;
  }

  return requireAuth(request, env);
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const withCors = (response) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
};

export const jsonResponse = (data, status = 200) => {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
  return response;
};

export const errorResponse = (message, code, status = 400) => {
  return jsonResponse({ error: message, code }, status);
};