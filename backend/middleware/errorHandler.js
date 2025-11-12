import { logErrorEvent } from './logging.js';

export const errorHandler = (err, req, res, next) => {
  const status = err.status || (err.message === 'Origin not allowed by CORS' ? 403 : 500);
  const payload = {
    error: err.code || 'server_error',
    message: status >= 500 ? 'An unexpected error occurred.' : err.message || 'Request failed.'
  };

  logErrorEvent({
    errorType: payload.error,
    status,
    path: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  res.status(status).json(payload);
};
