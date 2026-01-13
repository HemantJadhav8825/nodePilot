import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deployQueue } from '../queue/deploy.queue.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_FILE = path.join(__dirname, '../config/projects.json');

export const listProjects = async (request, reply) => {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    request.log.error(error);
    return [];
  }
};

export const getProject = async (request, reply) => {
  const { id } = request.params;
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf8');
    const projects = JSON.parse(data);
    const project = projects.find(p => p.id === id);
    if (!project) {
      return reply.status(404).send({ error: 'Not Found', message: 'Project not found' });
    }
    return project;
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Server Error' });
  }
};

export const triggerDeploy = async (request, reply) => {
  const { id } = request.params;
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf8');
    const projects = JSON.parse(data);
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return reply.status(404).send({ error: 'Not Found', message: 'Project not found' });
    }

    await deployQueue.add(`deploy-${project.id}`, {
      repoName: project.repoName,
      cloneUrl: `https://github.com/${project.repoName}.git`, // Defaulting to public or configured
      branch: project.branch || 'main',
      timestamp: new Date().toISOString(),
    });

    return { status: 'queued', project: project.name };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Server Error' });
  }
};
