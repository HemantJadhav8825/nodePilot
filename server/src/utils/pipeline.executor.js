import { runPipeline } from './executor.js';
import { redisConnection } from './redis.js';

const LOCK_KEY = 'nodepilot:deploy:lock';
const LOCK_TTL = 900; // 15 minutes in seconds

/**
 * Pipeline Executor with Redis Locking
 */
export const executePipeline = async (job) => {
  const { repoName } = job.data;
  
  // 1. Attempt to acquire lock (NX = Set if not exists, EX = Expire)
  const lockAcquired = await redisConnection.set(LOCK_KEY, `job:${job.id}`, 'NX', 'EX', LOCK_TTL);

  if (!lockAcquired) {
    const errorMsg = `Deployment already in progress. Skipping job ${job.id} for ${repoName}.`;
    console.warn(`[Lock] ${errorMsg}`);
    throw new Error(errorMsg); // BullMQ will handle the failure
  }

  console.log(`[Lock] Acquired for job ${job.id} (${repoName})`);

  try {
    // 2. Run the actual pipeline
    return await runPipeline(job.data, job.id);
  } finally {
    // 3. Always release lock when done (success or failure)
    await redisConnection.del(LOCK_KEY);
    console.log(`[Lock] Released for job ${job.id}`);
  }
};



