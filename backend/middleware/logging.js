import onFinished from 'on-finished';
import logger from '../services/logger.js';
import { persistEvent } from '../services/db.js';
import { sendToSplunk } from '../services/splunk.js';
import { recordRequest, recordRedesign, recordError } from '../services/metricsStore.js';

const asyncPipelines = async (event) => {
  try {
    await persistEvent(event);
  } catch (error) {
    logger.error('Failed to persist event', { error: error.message });
  }
  try {
    await sendToSplunk(event);
  } catch (error) {
    logger.error('Failed to send event to Splunk', { error: error.message });
  }
};

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  onFinished(res, () => {
    const latency = Date.now() - start;
    const event = {
      type: 'http_request',
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      status: res.statusCode,
      latency,
      userId: req.user?.id || null,
      role: req.user?.role || null,
      userAgent: req.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    };

    logger.info('request', event);
    recordRequest({ ip: event.ip, statusCode: event.status });
    setImmediate(() => {
      asyncPipelines(event);
    });
  });
  next();
};

export const logRedesignEvent = (details) => {
  const event = {
    type: 'redesign_event',
    timestamp: new Date().toISOString(),
    ...details
  };
  logger.info('redesign', event);
  recordRedesign({ style: details.style, success: details.success });
  setImmediate(() => {
    asyncPipelines(event);
  });
};

export const logErrorEvent = (details) => {
  const event = {
    type: 'error_event',
    timestamp: new Date().toISOString(),
    ...details
  };
  logger.error('error', event);
  recordError(details.errorType || 'unknown');
  setImmediate(() => {
    asyncPipelines(event);
  });
};
