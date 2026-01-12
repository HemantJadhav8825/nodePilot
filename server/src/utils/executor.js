import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { execa } from 'execa';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Pipeline Engine Executor
 */
export async function runPipeline(jobData) {
  const { repoName, branch } = jobData;
  const pipelinePath = path.join(__dirname, '../../../../pipelines/pipeline.yml');

  console.log(`[Executor] Reading pipeline configuration for ${repoName}`);

  try {
    // 1. Read and parse YAML
    const fileContent = await fs.readFile(pipelinePath, 'utf8');
    const config = yaml.load(fileContent);

    if (!config || !config.steps) {
      throw new Error('Invalid pipeline configuration: "steps" is required');
    }

    console.log(`[Executor] Starting pipeline: ${config.name || 'Unnamed Pipeline'}`);

    // 2. Execute steps sequentially
    for (const step of config.steps) {
      console.log(`\n--- Step: ${step.name || 'Unnamed Step'} ---`);

      try {
        const subprocess = execa(step.run, {
          shell: true,
          all: true,
          env: {
            ...process.env,
            REPO_NAME: repoName,
            BRANCH: branch,
          },
          // Set working directory if workspace logic is implemented later
          // cwd: workspacePath, 
        });

        // 3. Stream stdout/stderr to console
        subprocess.all.on('data', (data) => {
          process.stdout.write(data);
        });

        await subprocess;
        
        console.log(`[Executor] Step "${step.name}" completed successfully.`);
      } catch (stepError) {
        console.error(`[Executor] Step "${step.name}" failed: ${stepError.message}`);
        // 4. Stop pipeline on failure
        throw new Error(`Pipeline failed at step: ${step.name}`);
      }
    }

    console.log(`\n[Executor] Pipeline completed successfully for ${repoName}`);
    return { success: true };

  } catch (error) {
    console.error(`[Executor] Pipeline Error: ${error.message}`);
    throw error;
  }
}
