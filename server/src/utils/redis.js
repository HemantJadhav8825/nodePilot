import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null, // Required by BullMQ
};

// Singleton Redis connection for reuse
export const redisConnection = new Redis(redisConfig);

redisConnection.on('error', (err) => {
  console.error('Redis Connection Error:', err);
});
