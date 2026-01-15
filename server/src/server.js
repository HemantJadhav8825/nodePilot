import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "./app.js";

// Resolve paths for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const PORT = process.env.PORT || 7001;
const HOST = process.env.HOST || "0.0.0.0";

/**
 * Start Server
 */
const start = async () => {
  const app = await createApp();

  // Handle graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down...`);
    try {
      await app.close();
      console.log("[Server] Service closed.");
      process.exit(0);
    } catch (err) {
      console.error("[Server] Shutdown error:", err);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`NodePilot Server started at http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error("Error starting server:", err);
    process.exit(1);
  }
};

start();
