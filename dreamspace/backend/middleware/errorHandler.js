import logger from '../services/logger.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const status = err.status || 500;
  const response = {
    error: err.message || 'Internal server error'
  };

  if (process.env.NODE_ENV !== 'production' && err.details) {
    response.details = err.details;
  }

  res.status(status).json(response);
};

export default errorHandler;
