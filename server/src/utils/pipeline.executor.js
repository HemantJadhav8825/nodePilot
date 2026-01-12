import { runPipeline } from './executor.js';
import { redisConnection } from './redis.js';

/**
 * Pipeline Executor with Redis Locking (Per-Repository)
 */
export const executePipeline = async (job) => {
  const { repoName } = job.data;
  
  // Per-repo lock key: nodepilot:lock:<repoName>
  // repoName might contain slashes, we'll keep them or replace them for Redis
  const safeRepoName = repoName.replace(/\//g, ':');
  const LOCK_KEY = `nodepilot:lock:${safeRepoName}`;
  const LOCK_TTL = 900; // 15 minutes in seconds

  // 1. Attempt to acquire lock (NX = Set if not exists, EX = Expire)
  const lockAcquired = await redisConnection.set(LOCK_KEY, `job:${job.id}`, 'NX', 'EX', LOCK_TTL);

  if (!lockAcquired) {
    const errorMsg = `Deployment already in progress for ${repoName}. Skipping job ${job.id}.`;
    console.warn(`[Lock] ${errorMsg}`);
    throw new Error(errorMsg); // BullMQ will handle the failure
  }

  console.log(`[Lock] Acquired for ${repoName} (Job: ${job.id})`);

  try {
    // 2. Run the actual pipeline
    return await runPipeline(job.data, job.id);
  } finally {
    // 3. Always release lock when done (success or failure)
    await redisConnection.del(LOCK_KEY);
    console.log(`[Lock] Released for ${repoName} (Job: ${job.id})`);
  }
};



