import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { redisConnection } from '../utils/redis.js';
import { executePipeline } from '../utils/pipeline.executor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

/**
 * NodePilot Deployment Worker
 */
export const deployWorker = new Worker(
  'deploy',
  async (job) => {
    console.log(`[Worker] Started Job ID: ${job.id} for ${job.data.repoName}`);
    
    try {
      const result = await executePipeline(job);
      console.log(`[Worker] Job ID: ${job.id} finished successfully`);
      return result;
    } catch (error) {
      console.error(`[Worker] Job ID: ${job.id} failed:`, error.message);
      // Throw error to BullMQ to handle retries/failures
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // VPS friendly
    limiter: {
      max: 1,
      duration: 1000,
    },
  }
);

// Worker Events
deployWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} has completed!`);
});

deployWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} has failed with ${err.message}`);
});

deployWorker.on('error', (err) => {
  // Logic to prevent process crash
  console.error('[Worker] Fatal error encountered:', err);
});

console.log('[Worker] Deploy worker initialized and listening for jobs...');
