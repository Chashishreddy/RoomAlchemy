import rateLimit from 'express-rate-limit';

const parseWindow = (input) => {
  if (!input) return 60 * 1000;
  if (typeof input === 'number') return input;
  const match = input.match(/^(\d+)(ms|s|m|h)$/i);
  if (!match) return 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 'ms':
      return value;
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      return 60 * 1000;
  }
};

const windowMs = parseWindow(process.env.RATE_LIMIT_WINDOW);
const max = Number(process.env.RATE_LIMIT_MAX) || 5;

const createHandler = (name) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'rate_limited',
      message: `Too many requests to ${name}. Please retry later.`,
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }
});

export const globalLimiter = createHandler('RoomAlchemy API');
export const redesignLimiter = createHandler('RoomAlchemy redesign service');
