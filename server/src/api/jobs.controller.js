import { Queue } from 'bullmq';
import { redisConnection } from '../utils/redis.js';

const deployQueue = new Queue('deploy', { connection: redisConnection });

export const getBuildHistory = async (request, reply) => {
  const { projectName } = request.query;
  
  try {
    // BullMQ keeps track of jobs in various states
    // We can fetch completed and failed jobs
    const [completed, failed] = await Promise.all([
      deployQueue.getJobs(['completed'], 0, 50, false),
      deployQueue.getJobs(['failed'], 0, 50, false)
    ]);

    const allJobs = [...completed, ...failed]
      .map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        status: job.finishedOn ? (job.failedReason ? 'failed' : 'completed') : 'active',
        timestamp: job.timestamp,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason
      }))
      .filter(job => !projectName || job.data.repoName.includes(projectName))
      .sort((a, b) => b.timestamp - a.timestamp);

    return allJobs;
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Server Error' });
  }
};

export const getJobStatus = async (request, reply) => {
  const { jobId } = request.params;
  
  try {
    const job = await deployQueue.getJob(jobId);
    if (!job) {
      return reply.status(404).send({ error: 'Not Found', message: 'Job not found' });
    }

    const state = await job.getState();
    return {
      id: job.id,
      state,
      progress: job.progress,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn
    };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Server Error' });
  }
};
