# NodePilot CI/CD

NodePilot is a high-reliability, distributed CI/CD system designed for lightweight and secure deployments on VPS environments. It allows you to automate your MERN stack (or any Node.js) deployments via GitHub Webhooks.

## Prerequisites

Before installing NodePilot, ensure your VPS has the following:

- **Node.js**: v18.x or higher
- **Redis**: Required for the job queue (BullMQ)
- **PM2**: Recommended for process management
- **Git**: For cloning and pulling repositories

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/nodePilot.git
   cd nodePilot/server
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the `server` directory:
   ```env
   PORT=7000
   GITHUB_SECRET=your_webhook_secret_here
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   LOG_LEVEL=info
   ```

## Getting Started

1. **Start Redis** (if not already running):

   ```bash
   sudo systemctl start redis
   ```

2. **Start NodePilot with PM2**:
   Use the provided configuration to start both the server and the worker:

   ```bash
   npx pm2 start ecosystem.config.cjs
   ```

3. **Configure GitHub Webhook**:
   - Go to your GitHub repository -> Settings -> Webhooks.
   - Payload URL: `http://your-vps-ip:7000/webhook/github`
   - Content type: `application/json`
   - Secret: (Paste the `GITHUB_SECRET` from your `.env`)
   - Which events: Just the `push` event.

## Architecture Overview

NodePilot handles deployments using a decoupled, queue-based architecture to ensure stability and security.

### How it Works

NodePilot: Low-Level Architecture Explanation
NodePilot is a distributed CI/CD system designed to handle high-reliability deployments with minimal resource overhead. Here is how the entire process works, from the moment you push code to GitHub to the final deployment on your VPS.

1. The Entry Point: Webhook Reception
   The process begins with a POST request from GitHub to your /webhook/github endpoint.

Fastify Server: Receives the raw request.
HMAC Verification: To prevent "replay attacks" or unauthorized triggers, the server calculates a SHA-256 hash of the incoming body using your GITHUB_SECRET. It compares this hash with the x-hub-signature-256 header sent by GitHub. If they don't match exactly, the request is rejected immediately.
Payload Extraction: The server extracts the repository name, clone URL, and branch name from the JSON body.

2. The Broker: Redis & BullMQ
   Instead of running the deployment directly (which would block the server and time out), NodePilot uses a Job Queue.

BullMQ: Creates a "Job" containing the metadata (repo, branch, etc.).
Redis: Acts as the database for the queue. It stores the job in a "waiting" state. This ensures that even if the server restarts, the deployment task is not lost.

3. The Orchestrator: Deploy Worker
   Running in a separate process, the nodepilot-worker listens to Redis.

Locking Mechanism: Before starting a deployment, the worker tries to set a nodepilot:deploy:lock key in Redis with a 15-minute expiration. This is crucial: it prevents two different workers from trying to update the same directory at the same time, which would corrupt your files.
Concurrency Control: The worker is configured with concurrency: 2, meaning it can handle two different repositories simultaneously, but the locking ensures it won't handle the same repository or overlapping directories improperly.

4. The Execution Engine: Pipeline Executor
   This is where the actual shell commands happen.

YAML Parsing: The executor reads your
pipelines/pipeline.yml
file.
Execa Engine: It uses execa to spawn shell processes. Unlike standard child_process, execa handles stream logging and timeouts gracefully.
Dynamic Context: It injects environment variables into every command:
TARGET_DIR: The path where the code lives (e.g., /root/mern/admin-panel).
PM2_NAME: The process name derived from the repo name.
Logging: Every line of output from your scripts (like npm install or pm2 restart) is captured in real-time and written to a physical log file in server/logs/ named after the job ID.

#-------------------------------------------------------------------------
Summary of Components
BullMQ: Reliability (retries if a download fails).
Redis: Persistence (jobs survive crashes).
Execa: Control (manages shell command lifecycle).
PM2: Stability (keeps the whole system alive).
This architecture ensures your deployments are atomic (one at a time), traced (logs for every step), and secure (verified by GitHub).

#-------------------------------------------------------------------------
<img width="1012" height="684" alt="image" src="https://github.com/user-attachments/assets/5b1cb90d-8980-452c-8a6f-7f88eb003ffa" />

