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
 * Pipeline Engine Executor (Dynamic YAML version)
 */
export async function runPipeline(jobData, jobId) {
  const { repoName, branch, cloneUrl } = jobData;
  const logFilePath = path.join(LOGS_DIR, `${jobId}.log`);

  // Ensure logs directory exists
  await fs.mkdir(LOGS_DIR, { recursive: true });
  const logStream = createWriteStream(logFilePath, { flags: "a" });

  const log = (msg) => {
    const formatted = `${new Date().toISOString()} - ${msg}\n`;
    process.stdout.write(formatted);
    logStream.write(formatted);
  };

  log(`[Executor] Starting dynamic pipeline for ${repoName} (Job: ${jobId})`);

  try {
    // 1. Initial Target Directory Determination
    // We need a path to sync the repo to read the config
    const repoShortName = repoName.split("/").pop();
    const baseDir = process.env.DEPLOY_BASE_DIR || "/root/mern";
    let targetDir = jobData.targetDir || path.join(baseDir, repoShortName);

    log(`[Executor] Preparing target directory: ${targetDir}`);
    await fs.mkdir(targetDir, { recursive: true });

    // 2. Git Sync (Fetch/Checkout)
    log(`[Executor] Syncing repository ${repoName} (branch: ${branch})...`);

    // Check if .git exists to decide clone vs fetch
    const isGitRepo = await fs
      .access(path.join(targetDir, ".git"))
      .then(() => true)
      .catch(() => false);

    if (!isGitRepo) {
      log(`[Executor] Cloning repository...`);
      await execa("git", ["clone", "-b", branch, cloneUrl, "."], {
        cwd: targetDir,
      });
    } else {
      log(`[Executor] Fetching and resetting repository...`);
      await execa("git", ["fetch", "origin", branch], { cwd: targetDir });
      await execa("git", ["checkout", branch], { cwd: targetDir });
      await execa("git", ["reset", "--hard", `origin/${branch}`], {
        cwd: targetDir,
      });
    }

    // 3. Load nodepilot.yml
    const configPath = path.join(targetDir, "nodepilot.yml");
    let config;
    try {
      const fileContent = await fs.readFile(configPath, "utf8");
      config = yaml.load(fileContent);
      log(`[Executor] Loaded nodepilot.yml`);
    } catch (e) {
      log(
        `[Executor] Warning: nodepilot.yml not found in project root. Falling back to default or failing.`,
      );
      throw new Error(
        `nodepilot.yml is required for dynamic pipelines. Not found at: ${configPath}`,
      );
    }

    // 4. Update targetDir if YAML specifies a deploy_path
    if (config.server?.deploy_path) {
      const newTargetDir = path.resolve(config.server.deploy_path);
      if (newTargetDir !== targetDir) {
        log(
          `[Executor] YAML specified deploy_path: ${newTargetDir}. Re-syncing to new path...`,
        );
        // Note: In a real production system, moving might be complex.
        // For simplicity, we just sync again to the new path if it's different.
        targetDir = newTargetDir;
        await fs.mkdir(targetDir, { recursive: true });

        // Check again for .git in the new path
        const isNewGitRepo = await fs
          .access(path.join(targetDir, ".git"))
          .then(() => true)
          .catch(() => false);
        if (!isNewGitRepo) {
          await execa("git", ["clone", "-b", branch, cloneUrl, "."], {
            cwd: targetDir,
          });
        } else {
          await execa("git", ["fetch", "origin", branch], { cwd: targetDir });
          await execa("git", ["checkout", branch], { cwd: targetDir });
          await execa("git", ["reset", "--hard", `origin/${branch}`], {
            cwd: targetDir,
          });
        }
      }
    }

    if (!config.steps) {
      throw new Error('Invalid nodepilot.yml: "steps" is required');
    }

    // 5. Execute Steps Sequentially
    const stages = ["install", "build", "test", "deploy"];

    for (const stage of stages) {
      const commands = config.steps[stage];
      if (!commands || !Array.isArray(commands)) continue;

      log(`\n--- Stage: ${stage.toUpperCase()} ---`);

      for (let cmd of commands) {
        if (typeof cmd !== "string") cmd = String(cmd);
        log(`[Executor] Running: ${cmd}`);
        try {
          const subprocess = execa(cmd, {
            shell: true,
            all: true,
            cwd: targetDir,
            timeout: 600000,
            env: {
              ...process.env,
              PROJECT_NAME: config.project?.name || repoShortName,
              DEPLOY_DIR: targetDir,
              REPO_NAME: repoName,
              BRANCH: branch,
            },
          });

          if (subprocess && subprocess.all) {
            subprocess.all.on("data", (data) => {
              process.stdout.write(data);
              logStream.write(data);
            });
          }

          await subprocess;
        } catch (stepError) {
          log(`[Executor] Command failed: ${cmd}`);
          log(`[Executor] Error: ${stepError.message}`);
          throw new Error(
            `Pipeline failed at stage "${stage}" during command: ${cmd}`,
          );
        }
      }
    }

    log(`\n[Executor] Pipeline successful for ${repoName}`);
    return { success: true };
  } catch (error) {
    log(`\n[Executor] Pipeline Error: ${error.message}`);
    throw error;
  } finally {
    if (logStream) {
      logStream.end();
    }
  }
}
