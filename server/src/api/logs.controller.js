import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.join(__dirname, "../../logs");

export const getLogs = async (request, reply) => {
  const { jobId } = request.params;
  const logFilePath = path.join(LOGS_DIR, `${jobId}.log`);

  try {
    // Check if log file exists
    await fs.access(logFilePath);

    // Read the log file
    // For a lightweight UI, we might want to return the last N lines or stream it
    // For now, we return the whole file as it's simpler for "functional-first"
    const content = await fs.readFile(logFilePath, "utf8");
    return { content };
  } catch (error) {
    if (error.code === "ENOENT") {
      return reply
        .status(404)
        .send({ error: "Not Found", message: "Log file not found" });
    }
    request.log.error(error);
    return reply.status(500).send({ error: "Server Error" });
  }
};
