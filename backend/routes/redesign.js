import { Router } from 'express';
import { redesignRoom } from '../controllers/redesignController.js';
import { redesignLimiter } from '../middleware/limiter.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload, handleUploadErrors } from '../middleware/validateUpload.js';

const router = Router();
const uploadSingle = upload.single('image');

router.post(
  '/',
  redesignLimiter,
  authMiddleware,
  (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        return handleUploadErrors(err, req, res, next);
      }
      next();
    });
  },
  redesignRoom
);

export default router;
