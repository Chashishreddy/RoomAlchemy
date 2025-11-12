const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export const allowedStyles = [
  'Minimalist',
  'Japandi',
  'Cozy Scandinavian',
  'Luxury Modern',
  'Cyberpunk Neon',
  'Warm Boho'
];

export const validateRedesignInput = (req, res, next) => {
  const { style } = req.body;

  if (!style || !allowedStyles.includes(style)) {
    return res.status(400).json({ error: 'Invalid design style selected.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'An image file is required.' });
  }

  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Unsupported file type. Please upload JPEG, PNG, or WEBP images.' });
  }

  if (req.file.size > MAX_FILE_SIZE) {
    return res.status(400).json({ error: 'File too large. Maximum allowed size is 8MB.' });
  }

  return next();
};
