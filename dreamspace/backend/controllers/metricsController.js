import { getUsageMetrics } from '../services/metricsService.js';

export const getMetrics = (req, res) => {
  res.json({
    status: 'ok',
    data: getUsageMetrics()
  });
};
