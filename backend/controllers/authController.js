import { generateToken, blacklistToken, isTokenBlacklisted } from '../middleware/auth.js';

const DEMO_USERS = {
  'guest@roomalchemy.io': {
    id: 'guest-demo',
    role: 'guest',
    password: 'guestpass',
    name: 'Guest Designer'
  },
  'user@roomalchemy.io': {
    id: 'user-demo',
    role: 'user',
    password: 'userpass',
    name: 'Unlimited User'
  },
  'admin@roomalchemy.io': {
    id: 'admin-demo',
    role: 'admin',
    password: 'adminpass',
    name: 'Control Center'
  }
};

export const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'invalid_credentials', message: 'Email and password are required.' });
  }

  const account = DEMO_USERS[email.toLowerCase()];
  if (!account || account.password !== password) {
    return res.status(401).json({ error: 'invalid_credentials', message: 'Invalid email or password.' });
  }

  const token = generateToken({ id: account.id, role: account.role, email: email.toLowerCase() });
  return res.json({
    token,
    user: {
      id: account.id,
      email: email.toLowerCase(),
      role: account.role,
      name: account.name
    }
  });
};

export const logout = (req, res) => {
  const token = req.token || req.get('authorization')?.replace('Bearer ', '').trim();
  if (!token) {
    return res.status(400).json({ error: 'invalid_request', message: 'Authorization header required.' });
  }
  if (isTokenBlacklisted(token)) {
    return res.status(200).json({ message: 'Token already invalidated.' });
  }
  blacklistToken(token);
  return res.status(200).json({ message: 'Logged out successfully.' });
};
