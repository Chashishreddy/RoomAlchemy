import { Router } from 'express';
import multer from 'multer';
import { redesign } from '../controllers/redesignController.js';
import { validateRedesignInput } from '../middleware/validateRedesign.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.post('/redesign', upload.single('image'), validateRedesignInput, redesign);

export default router;
