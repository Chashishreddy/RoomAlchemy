export const requireRole = (...roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) {
    return res.status(403).json({ error: 'forbidden', message: 'Insufficient role permissions.' });
  }
  if (!roles.includes(role)) {
    return res.status(403).json({ error: 'forbidden', message: 'Insufficient role permissions.' });
  }
  next();
};
