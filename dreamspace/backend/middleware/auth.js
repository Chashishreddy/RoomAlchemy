import jwt from 'jsonwebtoken';
import config from '../config.js';
import logger from '../services/logger.js';

const ROLE_HIERARCHY = ['guest', 'user', 'admin'];

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    if (config.authOptional) {
      req.user = { role: 'guest' };
      return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid authorization header' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    logger.warn('JWT verification failed', { error: error.message });
    if (config.authOptional) {
      req.user = { role: 'guest' };
      return next();
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (requiredRole) => (req, res, next) => {
  const userRole = req.user?.role || 'guest';
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  if (userIndex === -1 || requiredIndex === -1) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (userIndex < requiredIndex) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  return next();
};
