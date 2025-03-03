import { startTransaction } from './sentry';
import logger from './logger';

const performanceLogger = logger.child({ module: 'performance' });

// Track function execution time with optional Sentry transaction
export const trackExecutionTime = async <T>(
  name: string,
  operation: string,
  fn: () => Promise<T>,
  options: { reportToSentry?: boolean; logLevel?: 'debug' | 'info' } = {}
): Promise<T> => {
  const { reportToSentry = false, logLevel = 'debug' } = options;
  const startTime = globalThis.performance.now();
  
  // Create Sentry transaction if enabled
  const transaction = reportToSentry ? startTransaction(name, operation) : null;
  
  try {
    // Execute the function
    const result = await fn();
    
    // Calculate execution time
    const executionTime = globalThis.performance.now() - startTime;
    
    // Log the performance data
    const logMessage = `${name} completed in ${executionTime.toFixed(2)}ms`;
    if (logLevel === 'info') {
      performanceLogger.info(logMessage, { operation, executionTime });
    } else {
      performanceLogger.debug(logMessage, { operation, executionTime });
    }
    
    // Finish Sentry transaction if it exists
    if (transaction) {
      transaction.setTag('execution_time_ms', executionTime.toFixed(2));
      transaction.finish();
    }
    
    return result;
  } catch (error) {
    // Finish Sentry transaction with error status
    if (transaction) {
      transaction.setStatus('error');
      transaction.finish();
    }
    
    // Re-throw the error
    throw error;
  }
};

// Memory usage tracking
export const getMemoryUsage = () => {
  if (typeof process !== 'undefined') {
    const memoryUsage = process.memoryUsage();
    return {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // Resident Set Size in MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // Total heap size in MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // Used heap size in MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // External memory in MB
    };
  }
  return null;
};

// Log memory usage
export const logMemoryUsage = (operation: string) => {
  const memoryUsage = getMemoryUsage();
  if (memoryUsage) {
    performanceLogger.info(`Memory usage for ${operation}`, { 
      operation, 
      memoryUsage 
    });
  }
};

// Export performance monitoring utilities
const performanceMonitoring = {
  trackExecutionTime,
  getMemoryUsage,
  logMemoryUsage,
};

export default performanceMonitoring; 