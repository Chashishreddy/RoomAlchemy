import express from 'express';
import dotenv from 'dotenv';
import securityHeaders from './middleware/securityHeaders.js';
import { globalLimiter } from './middleware/limiter.js';
import { requestLogger } from './middleware/logging.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import redesignRouter from './routes/redesign.js';
import adminRouter from './routes/admin.js';
import authRouter from './routes/auth.js';
import { initDb } from './services/db.js';
import logger from './services/logger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.set('trust proxy', 1);

securityHeaders.forEach((middleware) => app.use(middleware));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(globalLimiter);

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/redesign', redesignRouter);
app.use('/api/admin', adminRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Endpoint not found.' });
});

app.use(errorHandler);

const start = async () => {
  await initDb();
  app.listen(port, () => {
    logger.info(`RoomAlchemy server running on port ${port}`);
  });
};

start();
