const metrics = {
  totalRequests: 0,
  totalRedesigns: 0,
  redesignsByStyle: new Map(),
  errorsByType: new Map(),
  topIPs: new Map(),
  requestLog: []
};

const pushCount = (map, key, increment = 1) => {
  const current = map.get(key) || 0;
  map.set(key, current + increment);
};

export const recordRequest = ({ ip, statusCode }) => {
  metrics.totalRequests += 1;
  if (ip) {
    pushCount(metrics.topIPs, ip);
  }
  metrics.requestLog.push({ time: Date.now(), statusCode });
  if (metrics.requestLog.length > 10000) {
    metrics.requestLog.splice(0, metrics.requestLog.length - 5000);
  }
};

export const recordRedesign = ({ style, success }) => {
  metrics.totalRedesigns += success ? 1 : 0;
  if (style) {
    pushCount(metrics.redesignsByStyle, style, success ? 1 : 0);
  }
  if (!success) {
    pushCount(metrics.errorsByType, 'redesign_failure');
  }
};

export const recordError = (type = 'general_error') => {
  pushCount(metrics.errorsByType, type);
};

export const getMetricsSnapshot = () => {
  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  const last24hCounts = metrics.requestLog.reduce((acc, entry) => {
    if (entry.time >= last24h) {
      acc.total += 1;
      const key = `status_${entry.statusCode}`;
      acc.byStatus[key] = (acc.byStatus[key] || 0) + 1;
    }
    return acc;
  }, { total: 0, byStatus: {} });

  const toObject = (map) => Array.from(map.entries()).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

  return {
    totalRequests: metrics.totalRequests,
    totalRedesigns: metrics.totalRedesigns,
    redesignsByStyle: toObject(metrics.redesignsByStyle),
    errorsByType: toObject(metrics.errorsByType),
    topIPs: toObject(metrics.topIPs),
    last24hCounts
  };
};

export const resetMetrics = () => {
  metrics.totalRequests = 0;
  metrics.totalRedesigns = 0;
  metrics.redesignsByStyle.clear();
  metrics.errorsByType.clear();
  metrics.topIPs.clear();
  metrics.requestLog = [];
};
