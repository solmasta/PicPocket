export class AppError extends Error {
  constructor(message, code, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  UPLOAD_ERROR: 'UPLOAD_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
};

export function handleError(error, fallbackMessage = 'An unexpected error occurred') {
  if (error instanceof AppError) {
    return error;
  }

  if (error.name === 'TypeError' && error.message?.includes('fetch')) {
    return new AppError(
      'Network request failed. Please check your connection.',
      ErrorCodes.NETWORK_ERROR,
      0,
      { originalError: error.message }
    );
  }

  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return new AppError(
      'Request timed out. Please try again.',
      ErrorCodes.TIMEOUT_ERROR,
      408,
      { originalError: error.message }
    );
  }

  if (error.response?.status === 401) {
    return new AppError(
      'Authentication required. Please sign in again.',
      ErrorCodes.AUTH_ERROR,
      401,
      { originalError: error.message }
    );
  }

  if (error.response?.status === 404) {
    return new AppError(
      'Resource not found.',
      ErrorCodes.NOT_FOUND,
      404,
      { originalError: error.message }
    );
  }

  if (error.response?.status === 413) {
    return new AppError(
      'File too large. Please choose a smaller file.',
      ErrorCodes.UPLOAD_ERROR,
      413,
      { originalError: error.message }
    );
  }

  return new AppError(
    fallbackMessage,
    ErrorCodes.API_ERROR,
    error.response?.status || 500,
    { originalError: error.message }
  );
}

export function withErrorHandling(promise, fallbackMessage = 'An unexpected error occurred') {
  return promise
    .then(data => ({ data, error: null }))
    .catch(error => ({ data: null, error: handleError(error, fallbackMessage) }));
}

export async function asyncWrapper(fn, fallbackMessage = 'An unexpected error occurred') {
  try {
    const result = await fn();
    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: handleError(error, fallbackMessage) };
  }
}

export function logError(context, error, extra = {}) {
  const errorInfo = {
    context,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...extra
  };
  console.error('[PicPocket Error]', errorInfo);
  return errorInfo;
}