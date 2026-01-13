import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { execa } from "execa";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../../");
const LOGS_DIR = path.join(PROJECT_ROOT, "server/logs");

/**
 * Pipeline Engine Executor
 */
export async function runPipeline(jobData, jobId) {
  const { repoName, branch } = jobData;

  // Resolution: Env Var > Default Path
  const pipelinePath = process.env.PIPELINE_CONFIG_PATH
    ? path.resolve(process.env.PIPELINE_CONFIG_PATH)
    : path.join(PROJECT_ROOT, "pipelines/pipeline.yml");

  const logFilePath = path.join(LOGS_DIR, `${jobId}.log`);

  // Ensure logs directory exists
  await fs.mkdir(LOGS_DIR, { recursive: true });
  const logStream = createWriteStream(logFilePath, { flags: "a" });

  const log = (msg) => {
    const formatted = `${new Date().toISOString()} - ${msg}\n`;
    process.stdout.write(formatted);
    logStream.write(formatted);
  };

  log(`[Executor] Starting pipeline for ${repoName} (Job: ${jobId})`);
  log(`[Executor] Using pipeline config: ${pipelinePath}`);

  try {
    // Verify file existence first for better error message
    try {
      await fs.access(pipelinePath);
    } catch (e) {
      throw new Error(`Pipeline config not found at: ${pipelinePath}`);
    }

    const fileContent = await fs.readFile(pipelinePath, "utf8");
    const config = yaml.load(fileContent);

    if (!config || !config.steps) {
      throw new Error('Invalid pipeline configuration: "steps" is required');
    }

    log(`[Executor] Pipeline: ${config.name || "Unnamed Pipeline"}`);

    for (const step of config.steps) {
      log(`\n--- Step: ${step.name || "Unnamed Step"} ---`);

      try {
        // Resolution: Job Data > Env Var > Default
        const repoShortName = repoName.split("/").pop();
        const baseDir = process.env.DEPLOY_BASE_DIR || "/root/mern";

        const targetDir =
          jobData.targetDir || path.join(baseDir, repoShortName);
        const pm2Name = jobData.pm2Name || repoShortName;

        log(`[Executor] Target Directory: ${targetDir}`);
        log(`[Executor] PM2 Process Name: ${pm2Name}`);

        const subprocess = execa(step.run, {
          shell: true,
          all: true,
          timeout: 600000,
          killSignal: "SIGKILL",
          env: {
            ...process.env,
            REPO_NAME: repoName,
            BRANCH: branch,
            TARGET_DIR: targetDir,
            PM2_NAME: pm2Name,
          },
        });

        subprocess.all.on("data", (data) => {
          process.stdout.write(data);
          logStream.write(data);
        });

        await subprocess;
        log(`[Executor] Step "${step.name}" completed.`);
      } catch (stepError) {
        log(`[Executor] Step "${step.name}" failed: ${stepError.message}`);
        throw new Error(`Pipeline failed at step: ${step.name}`);
      }
    }

    log(`\n[Executor] Pipeline successful for ${repoName}`);
    return { success: true };
  } catch (error) {
    log(`[Executor] Pipeline Error: ${error.message}`);
    throw error;
  } finally {
    if (logStream) {
      logStream.end();
    }
  }
}
