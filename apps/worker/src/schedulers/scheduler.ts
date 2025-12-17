import { createChildLogger } from '@serp/core';
import type { ScheduledTask } from 'node-cron';
import { schedule } from 'node-cron';

const logger = createChildLogger({ component: 'scheduler' });

export interface ScheduledJob {
  name: string;
  schedule: string; // Cron expression
  task: () => Promise<void>;
  enabled?: boolean;
}

const jobs: ScheduledJob[] = [];
const tasks: ScheduledTask[] = [];

/**
 * Register a scheduled job
 */
export function registerJob(job: ScheduledJob): void {
  if (job.enabled === false) {
    logger.debug({ jobName: job.name }, 'Job disabled, skipping registration');
    return;
  }

  logger.info({ jobName: job.name, schedule: job.schedule }, 'Registering scheduled job');

  const task = schedule(
    job.schedule,
    async () => {
      const startTime = Date.now();
      logger.info({ jobName: job.name }, 'Starting scheduled job');
      
      try {
        await job.task();
        const duration = Date.now() - startTime;
        logger.info({ jobName: job.name, durationMs: duration }, 'Scheduled job completed');
      } catch (err) {
        const duration = Date.now() - startTime;
        logger.error({ err, jobName: job.name, durationMs: duration }, 'Scheduled job failed');
      }
    },
    {
      scheduled: false, // Don't start immediately
    }
  );

  jobs.push(job);
  tasks.push(task);
}

/**
 * Start all registered scheduled jobs
 */
export function startScheduler(): void {
  logger.info({ jobCount: jobs.length }, 'Starting scheduler');
  
  for (const task of tasks) {
    task.start();
  }
  
  logger.info('Scheduler started');
}

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
export function stopScheduler(): void {
  logger.info('Stopping scheduler');
  
  for (const task of tasks) {
    task.stop();
  }
  
  logger.info('Scheduler stopped');
}
