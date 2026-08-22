export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}

export function error(message, status = 500, code = 'INTERNAL_ERROR', details = null) {
  return json(
    {
      error: message,
      code,
      details,
      timestamp: new Date().toISOString(),
    },
    status
  );
}

export const ErrorCodes = {
  BAD_REQUEST: { code: 'BAD_REQUEST', status: 400 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', status: 404 },
  CONFLICT: { code: 'CONFLICT', status: 409 },
  PAYLOAD_TOO_LARGE: { code: 'PAYLOAD_TOO_LARGE', status: 413 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 422 },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500 },
};

export function handleApiError(error, context = 'API') {
  console.error(`[${context}] Error:`, error);

  if (error.status === 400 || error.message?.includes('validation')) {
    return error(error.message, ErrorCodes.BAD_REQUEST.status, ErrorCodes.BAD_REQUEST.code);
  }

  if (error.status === 401) {
    return error('Authentication required', ErrorCodes.UNAUTHORIZED.status, ErrorCodes.UNAUTHORIZED.code);
  }

  if (error.status === 404) {
    return error('Resource not found', ErrorCodes.NOT_FOUND.status, ErrorCodes.NOT_FOUND.code);
  }

  if (error.status === 413) {
    return error('File too large', ErrorCodes.PAYLOAD_TOO_LARGE.status, ErrorCodes.PAYLOAD_TOO_LARGE.code);
  }

  return error(
    'An unexpected error occurred',
    ErrorCodes.INTERNAL_ERROR.status,
    ErrorCodes.INTERNAL_ERROR.code
  );
}

export async function asyncHandler(fn, context = 'Handler') {
  try {
    return await fn();
  } catch (err) {
    return handleApiError(err, context);
  }
}