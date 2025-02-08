export * from './my-redis.module';
export * from './redis-spin-lock';
export * from './redis-cache';

export const CacheKeyPrefix = {
  AVAILABLE_TIMES: 'AVAILABLE_TIMES',
} as const;

export type KeyPrefixType = keyof typeof CacheKeyPrefix;

export const getCacheKey = (
  prefix: KeyPrefixType,
  key: string | number,
): string => {
  return `[${prefix}]::${key}`;
};
