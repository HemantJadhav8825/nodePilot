import crypto from 'node:crypto';
import { deployQueue } from '../queue/deploy.queue.js';

/**
 * Validates GitHub Webhook Signature (HMAC SHA256)
 */
const validateSignature = (payload, signature, secret) => {
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

/**
 * Handles GitHub Webhook Push Events
 */
export const githubWebhookHandler = async (request, reply) => {
  const signature = request.headers['x-hub-signature-256'];
  const event = request.headers['x-github-event'];
  const secret = process.env.GITHUB_SECRET;

  // 1. Validate Event Type
  if (event !== 'push') {
    request.log.info(`Ignored non-push event: ${event}`);
    return reply.status(202).send({ message: 'Event ignored' });
  }

  // 2. Validate Secret Configuration
  if (!secret) {
    request.log.error('GITHUB_SECRET is not defined in environment');
    return reply.status(500).send({ error: 'Server Error', message: 'Webhook secret not configured' });
  }

  // 3. Validate Signature
  const isValid = validateSignature(
    JSON.stringify(request.body), 
    signature, 
    secret
  );

  if (!isValid) {
    request.log.warn('Invalid webhook signature');
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid signature' });
  }

  const { repository, ref } = request.body;

  // 3. Extract metadata
  const cloneUrl = repository.clone_url;
  const branch = ref.replace('refs/heads/', '');

  request.log.info(`Received push for ${repository.full_name} on branch ${branch}`);

  // 4. Push to Queue
  await deployQueue.add(`deploy-${repository.name}`, {
    repoName: repository.full_name,
    cloneUrl,
    branch,
    timestamp: new Date().toISOString(),
  });

  return { status: 'queued', repository: repository.full_name, branch };
};
