import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import pLimit from 'p-limit';
import pRetry from 'p-retry';
import { createLogger } from '../monitoring/logger';
import { captureException } from '../monitoring/sentry';
import performance from '../monitoring/performance';

const logger = createLogger('scraping-queue');

/**
 * Scraping task data
 */
export interface ScrapingTask {
  id: string;
  url: string;
  priority?: number;
  options?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp?: number;
}

/**
 * Scraping task result
 */
export interface ScrapingResult {
  taskId: string;
  url: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
  duration: number;
  metadata?: Record<string, any>;
}

/**
 * Queue configuration options
 */
export interface ScrapingQueueOptions {
  concurrency?: number;
  rateLimitPerSecond?: number;
  retries?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  timeout?: number;
  redisUrl?: string;
  queueName?: string;
}

/**
 * Default queue options
 */
export const DEFAULT_QUEUE_OPTIONS: ScrapingQueueOptions = {
  concurrency: 5,
  rateLimitPerSecond: 2,
  retries: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  timeout: 60000,
  queueName: 'scraping-queue',
};

/**
 * Manages a queue for scraping tasks with rate limiting and retries
 */
export class ScrapingQueue {
  private queue: Queue;
  private options: ScrapingQueueOptions;
  private rateLimiter: ReturnType<typeof pLimit>;
  private processing = false;
  private worker: Worker | null = null;
  private taskProcessor: (task: ScrapingTask) => Promise<any>;
  private resultCallback?: (result: ScrapingResult) => Promise<void>;
  
  /**
   * Create a new ScrapingQueue
   * @param taskProcessor - Function to process tasks
   * @param options - Queue configuration options
   * @param resultCallback - Optional callback for task results
   */
  constructor(
    taskProcessor: (task: ScrapingTask) => Promise<any>,
    options: Partial<ScrapingQueueOptions> = {},
    resultCallback?: (result: ScrapingResult) => Promise<void>
  ) {
    this.options = { ...DEFAULT_QUEUE_OPTIONS, ...options };
    this.taskProcessor = taskProcessor;
    this.resultCallback = resultCallback;
    
    // Create rate limiter
    this.rateLimiter = pLimit(this.options.rateLimitPerSecond || 2);
    
    // Create Redis connection
    const redisClient = new Redis(this.options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    
    // Create queue with the queueName, defaulting to 'scraping-queue' if undefined
    const queueName = this.options.queueName || 'scraping-queue';
    this.queue = new Queue(queueName, {
      connection: redisClient,
      defaultJobOptions: {
        attempts: this.options.retries || 3,
        backoff: this.options.backoff || {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,  // Keep last 100 completed jobs
        removeOnFail: 200,      // Keep last 200 failed jobs
      },
    });
    
    logger.info('ScrapingQueue initialized', {
      queueName: this.options.queueName,
      concurrency: this.options.concurrency,
      rateLimitPerSecond: this.options.rateLimitPerSecond,
    });
  }
  
  /**
   * Add a task to the queue
   * @param task - Scraping task to add
   * @returns The job ID
   */
  async addTask(task: ScrapingTask): Promise<string> {
    // Add timestamp if not provided
    if (!task.timestamp) {
      task.timestamp = Date.now();
    }
    
    // Add to queue with priority (lower number = higher priority)
    const job = await this.queue.add(task.id, task, {
      priority: task.priority || 10,
      jobId: task.id,
    });
    
    logger.debug('Added task to queue', {
      taskId: task.id,
      url: task.url,
      priority: task.priority,
    });
    
    return job.id;
  }
  
  /**
   * Add multiple tasks to the queue
   * @param tasks - Array of scraping tasks
   * @returns Array of job IDs
   */
  async addTasks(tasks: ScrapingTask[]): Promise<string[]> {
    const now = Date.now();
    
    // Prepare jobs with timestamps
    // Use type cast to bypass TypeScript error
    const jobs = tasks.map(task => ({
      name: task.id,
      data: {
        ...task,
        timestamp: task.timestamp || now,
      },
      opts: {
        priority: task.priority || 10,
        jobId: task.id,
      },
    })) as any[];
    
    // Add jobs in bulk
    const addedJobs = await this.queue.addBulk(jobs);
    
    logger.info(`Added ${addedJobs.length} tasks to queue`);
    
    // Return array of job IDs, filtering out any undefined values
    return addedJobs.map(job => job.id).filter((id): id is string => id !== undefined);
  }
  
  /**
   * Start processing the queue
   */
  async startProcessing(): Promise<void> {
    if (this.processing) {
      logger.warn('Queue processing is already running');
      return;
    }
    
    this.processing = true;
    
    // Create worker
    const queueName = this.options.queueName || 'scraping-queue';
    this.worker = new Worker(
      queueName,
      async (job: Job) => {
        const task = job.data as ScrapingTask;
        
        logger.debug('Processing task', {
          taskId: task.id,
          url: task.url,
          attempt: job.attemptsMade,
        });
        
        const startTime = Date.now();
        
        try {
          // Use the rate limiter and retry logic
          const result = await this.rateLimiter(() => {
            return pRetry(
              () => this.processTask(task, job),
              {
                retries: this.options.retries || 3,
                onFailedAttempt: (error) => {
                  logger.warn(`Task attempt ${error.attemptNumber} failed`, {
                    taskId: task.id,
                    url: task.url,
                    error: error.message,
                    retriesLeft: error.retriesLeft,
                  });
                },
              }
            );
          });
          
          const duration = Date.now() - startTime;
          
          // Create successful result
          const successResult: ScrapingResult = {
            taskId: task.id,
            url: task.url,
            success: true,
            data: result,
            timestamp: Date.now(),
            duration,
            metadata: task.metadata,
          };
          
          // Call result callback if provided
          if (this.resultCallback) {
            await this.resultCallback(successResult);
          }
          
          logger.info(`Task completed successfully in ${duration}ms`, {
            taskId: task.id,
            url: task.url,
          });
          
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          // Log and report error
          logger.error('Task failed', {
            taskId: task.id,
            url: task.url,
            error: error instanceof Error ? error.message : String(error),
            attempt: job.attemptsMade,
          });
          
          // Create error result
          const errorResult: ScrapingResult = {
            taskId: task.id,
            url: task.url,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
            duration,
            metadata: task.metadata,
          };
          
          // Call result callback if provided
          if (this.resultCallback) {
            await this.resultCallback(errorResult);
          }
          
          // Report to Sentry
          captureException(error instanceof Error ? error : new Error(String(error)), {
            taskId: task.id,
            url: task.url,
            attempt: job.attemptsMade,
          });
          
          throw error;
        }
      },
      { 
        concurrency: this.options.concurrency || 5,
        connection: this.queue.opts.connection,
      }
    );
    
    // Handle worker events
    this.worker.on('completed', (job) => {
      logger.debug('Job completed', { jobId: job.id });
    });
    
    this.worker.on('failed', (job, error) => {
      logger.error('Job failed', {
        jobId: job?.id,
        error: error.message,
      });
    });
    
    this.worker.on('error', (error) => {
      logger.error('Worker error', {
        error: error.message,
      });
      captureException(error);
    });
    
    logger.info('Started queue processing', {
      concurrency: this.options.concurrency,
    });
  }
  
  /**
   * Process a scraping task with performance tracking
   * @param task - Scraping task to process
   * @param job - Queue job
   * @returns Processing result
   */
  private async processTask(task: ScrapingTask, job: Job): Promise<any> {
    return performance.trackExecutionTime(
      'ScrapingTask',
      'scraping',
      async () => {
        try {
          // Call the user-provided task processor
          return await this.taskProcessor(task);
        } catch (error) {
          logger.error('Error processing task', {
            taskId: task.id,
            url: task.url,
            error: error instanceof Error ? error.message : String(error),
            attempt: job.attemptsMade,
          });
          
          throw error;
        }
      },
      { reportToSentry: true, logLevel: 'info' }
    );
  }
  
  /**
   * Stop processing the queue
   */
  async stopProcessing(): Promise<void> {
    if (!this.processing) {
      return;
    }
    
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    
    this.processing = false;
    
    logger.info('Stopped queue processing');
  }
  
  /**
   * Get queue statistics
   * @returns Queue stats
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);
    
    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }
  
  /**
   * Clear the queue
   */
  async clearQueue(): Promise<void> {
    await this.queue.obliterate();
    logger.info('Queue cleared');
  }
  
  /**
   * Close the queue and connections
   */
  async close(): Promise<void> {
    await this.stopProcessing();
    await this.queue.close();
    
    logger.info('Queue closed');
  }
}

export default ScrapingQueue; 