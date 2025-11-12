import { Router } from 'express';
import { getMetrics } from '../controllers/metricsController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.get('/metrics', authMiddleware, requireRole('admin'), getMetrics);

export default router;
