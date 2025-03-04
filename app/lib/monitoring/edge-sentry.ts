/**
 * Edge-compatible Sentry implementation for use in Edge Runtime
 * This is a simplified version that works in Edge environments
 */

import * as Sentry from '@sentry/nextjs';
import { createLogger } from './edge-logger';

const logger = createLogger('edge-sentry');
let isSentryInitialized = false;

// Initialize Sentry for Edge environment if DSN is available
try {
  if (
    process.env.NEXT_PUBLIC_SENTRY_DSN &&
    !Sentry.getCurrentHub().getClient()
  ) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      maxBreadcrumbs: 50,
      // Edge-compatible integrations only
      integrations: [
        new Sentry.BrowserTracing(),
      ],
    });
    isSentryInitialized = true;
    logger.info('Edge Sentry initialized successfully');
  }
} catch (error) {
  logger.error('Failed to initialize Edge Sentry', {
    error: error instanceof Error ? error.message : String(error),
  });
}

/**
 * Captures exceptions in Edge environment
 * @param error - The error to capture
 * @param context - Additional context information
 */
export const captureException = (
  error: Error | string,
  context?: Record<string, any>
) => {
  // Log the error locally
  if (typeof error === 'string') {
    logger.error(error, context || {});
    
    // Only send to Sentry if initialized
    if (isSentryInitialized) {
      try {
        Sentry.captureMessage(error, {
          level: 'error',
          tags: context,
        });
      } catch (e) {
        logger.error('Failed to capture message in Sentry', {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  } else {
    logger.error(error.message, { 
      ...(context || {}), 
      stack: error.stack 
    });
    
    // Only send to Sentry if initialized
    if (isSentryInitialized) {
      try {
        Sentry.captureException(error, {
          tags: context,
        });
      } catch (e) {
        logger.error('Failed to capture exception in Sentry', {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }
};

/**
 * Creates a performance transaction
 * @param name - Transaction name
 * @param operation - Operation type
 */
export const startTransaction = (name: string, operation: string) => {
  if (!isSentryInitialized) {
    return {
      finish: () => {},
      setTag: () => {},
    };
  }
  
  try {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  } catch (e) {
    logger.error('Failed to start transaction', {
      error: e instanceof Error ? e.message : String(e),
    });
    
    // Return a dummy transaction
    return {
      finish: () => {},
      setTag: () => {},
    };
  }
};

export default {
  captureException,
  startTransaction,
}; 