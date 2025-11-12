import helmet from 'helmet';
import cors from 'cors';
import { buildCspDirectives } from '../utils/csp.js';

const parseOrigins = () => {
  const raw = process.env.ALLOWED_ORIGINS || '';
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const allowedOrigins = parseOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
};

const helmetMiddleware = helmet({
  contentSecurityPolicy: buildCspDirectives(),
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-origin' }
});

const corsMiddleware = cors(corsOptions);

const securityHeaders = [helmetMiddleware, corsMiddleware];

export default securityHeaders;
