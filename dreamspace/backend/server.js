import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from './config.js';
import logger from './services/logger.js';
import healthRoutes from './routes/healthRoutes.js';
import redesignRoutes from './routes/redesignRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import requestLogger from './middleware/requestLogger.js';
import { authenticate } from './middleware/auth.js';

const app = express();

app.set('trust proxy', 1);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || config.allowedOrigins.length === 0 || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"]
      }
    }
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

app.use(authenticate);
app.use(requestLogger);

app.use('/api', healthRoutes);
app.use('/api', redesignRoutes);
app.use('/api', adminRoutes);

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    logger.warn('CORS rejection', { origin: req.headers.origin });
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  return next(err);
});

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const start = () => {
  app.listen(config.port, () => {
    logger.info(`DreamSpace backend listening on port ${config.port}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export default app;
