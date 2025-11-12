import logger from '../services/logger.js';
import { recordUsage } from '../services/metricsService.js';

const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = Math.round(durationNs / 1e6);
    logger.info('HTTP request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ip: req.ip,
      userRole: req.user?.role || 'guest',
      durationMs
    });

    recordUsage({
      ip: req.ip,
      method: req.method,
      path: req.originalUrl,
      style: req.body?.style,
      status: res.statusCode
    });
  });
  next();
};

export default requestLogger;
