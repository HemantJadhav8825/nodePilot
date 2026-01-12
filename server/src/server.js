import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './app.js';

// Resolve paths for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = process.env.PORT || 7000;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Start Server
 */
const start = async () => {
  const app = await createApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`NodePilot Server started at http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error('Error starting server:', err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down NodePilot...`);
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
