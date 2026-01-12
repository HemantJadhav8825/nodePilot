import { runPipeline } from './executor.js';

/**
 * Pipeline Executor
 * Responsible for running the actual deployment steps
 */
export const executePipeline = async (job) => {
  return await runPipeline(job.data);
};

