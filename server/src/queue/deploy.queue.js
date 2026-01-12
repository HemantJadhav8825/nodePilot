import { Queue } from 'bullmq';
import { redisConnection } from '../utils/redis.js';

/**
 * Clean 'deploy' queue configuration
 */
export const deployQueue = new Queue('deploy', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 3600, // keep for 1 hour
      count: 100, // keep last 100
    },
    removeOnFail: {
      age: 24 * 3600, // keep for 24 hours
    },
  },
});
