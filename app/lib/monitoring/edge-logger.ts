/**
 * Edge-compatible logger for use in Edge Runtime environments
 * This is a simplified version that works without Node.js-specific modules
 */

// Simple log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Basic logger interface
export interface Logger {
  debug: (message: string, meta?: Record<string, any>) => void;
  info: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  error: (message: string, meta?: Record<string, any>) => void;
}

// Log level mapping (for filtering)
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Current log level from environment or default to 'info'
const getCurrentLogLevel = (): LogLevel => {
  try {
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    return LOG_LEVELS[envLogLevel] !== undefined ? envLogLevel : 'info';
  } catch {
    return 'info';
  }
};

// Get current environment
const getCurrentEnvironment = (): string => {
  try {
    return process.env.NODE_ENV || 'development';
  } catch {
    return 'development';
  }
};

// Current configured level
const CURRENT_LOG_LEVEL = getCurrentLogLevel();
const IS_PRODUCTION = getCurrentEnvironment() === 'production';

// Should the log be displayed based on level?
const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LOG_LEVEL];
};

// Format log entry for console output
const formatLogEntry = (level: LogLevel, message: string, meta: Record<string, any>, module?: string): string => {
  const timestamp = new Date().toISOString();
  const moduleInfo = module ? `[${module}] ` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  
  return `${timestamp} ${level.toUpperCase()}: ${moduleInfo}${message}${metaStr}`;
};

// Format log entry as JSON for structured logging
const formatLogEntryAsJson = (level: LogLevel, message: string, meta: Record<string, any>, module?: string): string => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    module,
    ...meta,
    service: 'tzironis-assistant'
  });
};

// Base logger implementation
const createBaseLogger = (module?: string): Logger => {
  return {
    debug: (message: string, meta = {}) => {
      if (!shouldLog('debug')) return;
      
      const logStr = IS_PRODUCTION 
        ? formatLogEntryAsJson('debug', message, meta, module)
        : formatLogEntry('debug', message, meta, module);
        
      console.debug(logStr);
    },
    
    info: (message: string, meta = {}) => {
      if (!shouldLog('info')) return;
      
      const logStr = IS_PRODUCTION 
        ? formatLogEntryAsJson('info', message, meta, module)
        : formatLogEntry('info', message, meta, module);
        
      console.info(logStr);
    },
    
    warn: (message: string, meta = {}) => {
      if (!shouldLog('warn')) return;
      
      const logStr = IS_PRODUCTION 
        ? formatLogEntryAsJson('warn', message, meta, module)
        : formatLogEntry('warn', message, meta, module);
        
      console.warn(logStr);
    },
    
    error: (message: string, meta = {}) => {
      if (!shouldLog('error')) return;
      
      const logStr = IS_PRODUCTION 
        ? formatLogEntryAsJson('error', message, meta, module)
        : formatLogEntry('error', message, meta, module);
        
      console.error(logStr);
    }
  };
};

// Create namespaced logger
export const createLogger = (module: string): Logger => {
  return createBaseLogger(module);
};

// Default logger
export default createBaseLogger(); 