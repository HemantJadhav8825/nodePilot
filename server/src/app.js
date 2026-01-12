import Fastify from 'fastify';
import formbody from '@fastify/formbody';
import { githubWebhookHandler } from './api/webhook.controller.js';

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

  // Register Form Body Support (for GitHub default content type)
  await app.register(formbody);

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
