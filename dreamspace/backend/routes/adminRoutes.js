import { Router } from 'express';
import { getMetrics } from '../controllers/metricsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/admin/metrics', authenticate, requireRole('admin'), getMetrics);

export default router;
