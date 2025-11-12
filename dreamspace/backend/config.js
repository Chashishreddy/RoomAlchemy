import dotenv from 'dotenv';

dotenv.config();

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const config = {
  port: parseInt(process.env.PORT, 10) || 8080,
  stabilityApiKey: process.env.STABILITY_API_KEY,
  stabilityApiBase: process.env.STABILITY_API_BASE || 'https://api.stability.ai',
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  rateLimit: {
    windowMs: (() => {
      const window = process.env.RATE_LIMIT_WINDOW || '1m';
      if (window.endsWith('m')) {
        return parseInt(window, 10) * 60 * 1000;
      }
      if (window.endsWith('s')) {
        return parseInt(window, 10) * 1000;
      }
      return parseInt(window, 10) || 60000;
    })(),
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 5
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  authOptional: parseBoolean(process.env.AUTH_OPTIONAL, true)
};

export default config;
