/**
 * Edge-compatible performance monitoring for Edge Runtime
 */

import { startTransaction } from './edge-sentry';
import { createLogger } from './edge-logger';

const logger = createLogger('performance');

/**
 * Track function execution time with optional Sentry transaction
 */
export const trackExecutionTime = async <T>(
  name: string,
  operation: string,
  fn: () => Promise<T>,
  options: { reportToSentry?: boolean; logLevel?: 'debug' | 'info' } = {}
): Promise<T> => {
  const { reportToSentry = false, logLevel = 'debug' } = options;
  
  // Use performance API which is available in Edge Runtime
  const startTime = performance.now();
  
  // Create Sentry transaction if enabled
  const transaction = reportToSentry ? startTransaction(name, operation) : null;
  
  try {
    // Execute the function
    const result = await fn();
    
    // Calculate execution time
    const executionTime = performance.now() - startTime;
    
    // Log the performance data
    const logMessage = `${name} completed in ${executionTime.toFixed(2)}ms`;
    if (logLevel === 'info') {
      logger.info(logMessage, { operation, executionTime });
    } else {
      logger.debug(logMessage, { operation, executionTime });
    }
    
    // Finish Sentry transaction if it exists
    if (transaction) {
      transaction.setTag?.('execution_time_ms', executionTime.toFixed(2));
      transaction.finish?.();
    }
    
    return result;
  } catch (error) {
    // Finish Sentry transaction with error status if it exists
    if (transaction) {
      // Note: The dummy transaction doesn't have setStatus, so we use optional chaining
      if ('setStatus' in transaction) {
        (transaction as any).setStatus('error');
      }
      transaction.finish?.();
    }
    
    // Re-throw the error
    throw error;
  }
};

// Export performance monitoring utilities
const performanceMonitoring = {
  trackExecutionTime,
};

export default performanceMonitoring; 