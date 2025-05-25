import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

export const cacheConfig: CacheModuleOptions = {
  store: redisStore,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  ttl: 60 * 5, // 5 minutes default TTL
  max: 100 // maximum number of items in cache
};
