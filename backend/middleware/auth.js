import jwt from 'jsonwebtoken';

const blacklist = new Set();

export const isAuthOptional = () => String(process.env.AUTH_OPTIONAL || 'false').toLowerCase() === 'true';

export const generateToken = (payload, options = {}) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1d',
    ...options
  });
};

export const authMiddleware = (req, res, next) => {
  const header = req.get('authorization');
  if (!header) {
    if (isAuthOptional()) {
      return next();
    }
    return res.status(401).json({ error: 'unauthorized', message: 'Authentication required.' });
  }

  const token = header.replace('Bearer ', '').trim();
  if (!token) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid authorization header.' });
  }
  if (blacklist.has(token)) {
    return res.status(401).json({ error: 'unauthorized', message: 'Token has been revoked.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token.' });
  }
};

export const blacklistToken = (token) => {
  if (token) {
    blacklist.add(token);
  }
};

export const isTokenBlacklisted = (token) => blacklist.has(token);
