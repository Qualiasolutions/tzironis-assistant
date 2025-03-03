import * as Sentry from '@sentry/nextjs';
import logger from './logger';

// Initialize Sentry if not already initialized and if DSN is available
if (
  process.env.NEXT_PUBLIC_SENTRY_DSN &&
  !Sentry.getCurrentHub().getClient()
) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Session replay for better error reproduction
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Set max breadcrumbs to avoid excessive data
    maxBreadcrumbs: 50,
    // Log level configuration
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });

  logger.info('Sentry initialized successfully');
}

/**
 * Captures exceptions with additional context
 * @param error - The error to capture
 * @param context - Additional context information
 */
export const captureException = (
  error: Error | string,
  context?: Record<string, any>
) => {
  // Log the error locally first
  if (typeof error === 'string') {
    logger.error(error, context);
    Sentry.captureMessage(error, {
      level: 'error',
      tags: context,
    });
  } else {
    logger.error(error.message, { ...context, stack: error.stack });
    Sentry.captureException(error, {
      tags: context,
    });
  }
};

/**
 * Creates a performance transaction
 * @param name - Transaction name
 * @param operation - Operation type
 */
export const startTransaction = (name: string, operation: string) => {
  return Sentry.startTransaction({
    name,
    op: operation,
  });
};

export default Sentry; 