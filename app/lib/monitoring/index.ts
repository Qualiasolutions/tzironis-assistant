import logger, { createLogger } from './logger';
import Sentry, { captureException, startTransaction } from './sentry';
import performance from './performance';

// Initialize monitoring
export const initializeMonitoring = () => {
  logger.info('Monitoring system initialized');
  
  // Add error handling for uncaught exceptions
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      captureException(event.error || new Error(event.message), {
        source: 'window.error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      captureException(event.reason || new Error('Unhandled Promise rejection'), {
        source: 'unhandledrejection',
      });
    });
    
    logger.info('Browser error handlers initialized');
  }
};

// Export all monitoring utilities
export {
  logger,
  createLogger,
  Sentry,
  captureException,
  startTransaction,
  performance,
};

export default {
  logger,
  Sentry,
  performance,
  initializeMonitoring,
}; 