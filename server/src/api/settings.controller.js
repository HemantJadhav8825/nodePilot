export const getEnv = async (request, reply) => {
  // Return a subset of process.env for security
  const safeEnv = {
    PORT: process.env.PORT,
    LOG_LEVEL: process.env.LOG_LEVEL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    GITHUB_SECRET: '********' // Always mask secrets
  };
  return safeEnv;
};
