export * from './my-redis.module';
export * from './redis-spin-lock';
export * from './redis-cache';
export * from './redis-token-queue';

export const CacheKeyPrefix = {
  AVAILABLE_TIMES: 'AVAILABLE_TIMES',
  ACTIVE_TOKENS: 'ACTIVE_TOKENS',
  WAITING_QUEUE: 'WAITING_QUEUE',
} as const;

export type KeyPrefixType = keyof typeof CacheKeyPrefix;

export const getCacheKey = (
  prefix: KeyPrefixType,
  key?: string | number,
): string => {
  if (key) return `[${prefix}]::${key}`;
  return `[${prefix}]`;
};
