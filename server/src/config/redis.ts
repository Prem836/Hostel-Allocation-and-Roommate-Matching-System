import { Redis } from 'ioredis';
import { ENV } from './env.js';

export const redisConnection = new Redis({
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  maxRetriesPerRequest: null,
});

redisConnection.on('connect', () => {
  console.log('[Redis] Connected to Redis successfully');
});

redisConnection.on('error', (err) => {
  console.warn('[Redis] Connection warning/error:', err.message);
});

