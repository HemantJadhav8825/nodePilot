import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deployQueue } from "../queue/deploy.queue.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_FILE = path.join(__dirname, "../config/projects.json");

export const listProjects = async (request, reply) => {
  try {
    const data = await fs.readFile(PROJECTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    request.log.error(error);
    return [];
  }
};

export const getProject = async (request, reply) => {
  const { id } = request.params;
  try {
    const data = await fs.readFile(PROJECTS_FILE, "utf8");
    const projects = JSON.parse(data);
    const project = projects.find((p) => p.id === id);
    if (!project) {
      return reply
        .status(404)
        .send({ error: "Not Found", message: "Project not found" });
    }
    return project;
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: "Server Error" });
  }
};

export const triggerDeploy = async (request, reply) => {
  const { id } = request.params;
  const { branch } = request.body || {};

  try {
    const data = await fs.readFile(PROJECTS_FILE, "utf8");
    const projects = JSON.parse(data);
    const project = projects.find((p) => p.id === id);

    if (!project) {
      return reply
        .status(404)
        .send({ error: "Not Found", message: "Project not found" });
    }

    const deployBranch = branch || project.branch || "main";

    await deployQueue.add(`deploy-${project.id}`, {
      repoName: project.repoName,
      cloneUrl: `https://github.com/${project.repoName}.git`, // Defaulting to public or configured
      branch: deployBranch,
      targetDir: project.targetDir,
      pm2Name: project.pm2Name,
      timestamp: new Date().toISOString(),
    });

    return { status: "queued", project: project.name };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: "Server Error" });
  }
};

export const createProject = async (request, reply) => {
  try {
    const { id, name, repoName, description, branch, pm2Name, targetDir } =
      request.body;

    if (!id || !name || !repoName) {
      return reply.status(400).send({
        error: "Bad Request",
        message: "id, name, and repoName are required",
      });
    }

    const data = await fs.readFile(PROJECTS_FILE, "utf8");
    const projects = JSON.parse(data);

    if (projects.find((p) => p.id === id)) {
      return reply.status(409).send({
        error: "Conflict",
        message: "Project with this ID already exists",
      });
    }

    const newProject = {
      id,
      name,
      repoName,
      description: description || "",
      branch: branch || "main",
      pm2Name: pm2Name || id,
      targetDir: targetDir || "",
    };

    projects.push(newProject);
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));

    return reply.status(201).send(newProject);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: "Server Error" });
  }
};

export const deleteProject = async (request, reply) => {
  const { id } = request.params;
  try {
    const data = await fs.readFile(PROJECTS_FILE, "utf8");
    const projects = JSON.parse(data);
    const index = projects.findIndex((p) => p.id === id);

    if (index === -1) {
      return reply
        .status(404)
        .send({ error: "Not Found", message: "Project not found" });
    }

    projects.splice(index, 1);
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));

    return { success: true };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: "Server Error" });
  }
};
