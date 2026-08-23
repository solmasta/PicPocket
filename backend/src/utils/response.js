export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}

// Renamed to avoid shadowing the function name in handleApiError
export function sendError(message, status = 500, code = 'INTERNAL_ERROR', details = null) {
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

export function handleApiError(err, context = 'API') {
  console.error(`[${context}] Error:`, err);

  if (err.status === 400 || err.message?.includes('validation')) {
    return sendError(err.message, ErrorCodes.BAD_REQUEST.status, ErrorCodes.BAD_REQUEST.code);
  }

  if (err.status === 401) {
    return sendError('Authentication required', ErrorCodes.UNAUTHORIZED.status, ErrorCodes.UNAUTHORIZED.code);
  }

  if (err.status === 404) {
    return sendError('Resource not found', ErrorCodes.NOT_FOUND.status, ErrorCodes.NOT_FOUND.code);
  }

  if (err.status === 413) {
    return sendError('File too large', ErrorCodes.PAYLOAD_TOO_LARGE.status, ErrorCodes.PAYLOAD_TOO_LARGE.code);
  }

  return sendError(
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
