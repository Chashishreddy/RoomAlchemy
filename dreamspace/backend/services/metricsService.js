const usageLog = [];

export const recordUsage = ({ ip, method, path, style, status }) => {
  usageLog.push({
    ip,
    method,
    path,
    style,
    status,
    timestamp: new Date().toISOString()
  });
  if (usageLog.length > 1000) {
    usageLog.shift();
  }
};

export const getUsageMetrics = () => {
  return {
    totalRequests: usageLog.length,
    recent: usageLog.slice(-50)
  };
};
