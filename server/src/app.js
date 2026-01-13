import Fastify from 'fastify';
import cors from '@fastify/cors';
import { githubWebhookHandler } from './api/webhook.controller.js';
import * as projectsController from './api/projects.controller.js';
import * as jobsController from './api/jobs.controller.js';
import * as logsController from './api/logs.controller.js';
import * as settingsController from './api/settings.controller.js';

/**
 * NodePilot Fastify Application
 */
export const createApp = async () => {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
    disableRequestLogging: true, // Custom logging for production
  });

  // Enable CORS
  await app.register(cors, {
    origin: true // Allow all origins for now, can be restricted later
  });

  // Basic Health Check
  app.get('/health', async () => {
    return { 
      status: 'ok', 
      uptime: process.uptime(),
      memory: process.memoryUsage().rss
    };
  });

  // Welcome Route
  app.get('/', async () => {
    return { name: 'NodePilot API', version: '1.0.0' };
  });

  // Webhook Routes
  app.post('/webhook/github', githubWebhookHandler);

  // Management API Routes
  app.get('/api/projects', projectsController.listProjects);
  app.get('/api/projects/:id', projectsController.getProject);
  app.post('/api/projects/:id/deploy', projectsController.triggerDeploy);

  app.get('/api/jobs', jobsController.getBuildHistory);
  app.get('/api/jobs/:jobId', jobsController.getJobStatus);
  
  app.get('/api/logs/:jobId', logsController.getLogs);
  app.get('/api/settings/env', settingsController.getEnv);

  // Error Handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.status(error.statusCode || 500).send({
      error: error.name,
      message: error.message,
      statusCode: error.statusCode || 500,
    });
  });

  return app;
};

