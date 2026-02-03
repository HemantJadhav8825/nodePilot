module.exports = {
  apps: [
    {
      name: "nodepilot-server",
      script: "src/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 7000,
      },
    },
    {
      name: "nodepilot-worker",
      script: "src/worker/deploy.worker.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "nodepilot-dashboard",
      cwd: "/root/nodePilot/dashboard",
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5175,
      },
    },
  ],
};
