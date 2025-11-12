const DAY_MS = 24 * 60 * 60 * 1000;

const quotaStore = new Map();

export const consumeQuota = (key, limit) => {
  const now = Date.now();
  let entry = quotaStore.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + DAY_MS };
  }

  if (entry.count >= limit) {
    quotaStore.set(key, entry);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    };
  }

  entry.count += 1;
  quotaStore.set(key, entry);
  return {
    allowed: true,
    remaining: Math.max(limit - entry.count, 0),
    resetAt: entry.resetAt
  };
};

export const getQuotaStatus = (key) => {
  const entry = quotaStore.get(key);
  if (!entry) {
    return { count: 0, resetAt: Date.now() + DAY_MS };
  }
  return { count: entry.count, resetAt: entry.resetAt };
};

export const resetQuotaStore = () => {
  quotaStore.clear();
};
