import { getMetricsSnapshot } from '../services/metricsStore.js';

export const getMetrics = (req, res) => {
  const snapshot = getMetricsSnapshot();
  res.json(snapshot);
};
