import multer from 'multer';

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error('invalid_mime'));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_BYTES,
    files: 1
  }
});

export const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'upload_error',
      message: error.message
    });
  }
  if (error?.message === 'invalid_mime') {
    return res.status(400).json({
      error: 'invalid_file_type',
      message: 'Only JPEG, PNG, and WEBP images are supported.'
    });
  }
  if (error) {
    return res.status(400).json({
      error: 'upload_error',
      message: error.message
    });
  }
  next();
};
