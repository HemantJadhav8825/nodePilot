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
    const attempt = job.attemptsMade + 1;
    console.log(`[Worker] Attempt ${attempt}/2 - Started Job ID: ${job.id} for ${job.data.repoName}`);
    
    try {
      const result = await executePipeline(job);
      console.log(`[Worker] Job ID: ${job.id} finished successfully`);
      return result;
    } catch (error) {
      console.error(`[Worker] Job ID: ${job.id} failed:`, error.message);
      
      // Do not retry if failure reason is "deployment lock active"
      if (error.message.includes('Deployment already in progress')) {
        console.warn(`[Worker] Job ID: ${job.id} discarded (lock active)`);
        await job.discard();
      }
      
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

/**
 * Graceful Shutdown for Worker
 */
const shutdown = async (signal) => {
  console.log(`\n[Worker] Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // 1. Stop processing new jobs and wait for current ones to finish
    await deployWorker.close();
    console.log('[Worker] Jobs finished. Connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('[Worker] Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
