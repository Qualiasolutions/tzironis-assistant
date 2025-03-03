import winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOGTAIL_SOURCE_TOKEN = process.env.LOGTAIL_SOURCE_TOKEN;

// Create custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create console format for readable logs in development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    }`;
  })
);

// Configure transports
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: NODE_ENV === 'production' ? customFormat : consoleFormat,
  }),
];

// Add Logtail transport in production if token is available
if (NODE_ENV === 'production' && LOGTAIL_SOURCE_TOKEN) {
  const logtail = new Logtail(LOGTAIL_SOURCE_TOKEN);
  transports.push(new LogtailTransport(logtail));
}

// Create logger instance
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: customFormat,
  defaultMeta: { service: 'tzironis-assistant' },
  transports,
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.Console({
      format: NODE_ENV === 'production' ? customFormat : consoleFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: NODE_ENV === 'production' ? customFormat : consoleFormat,
    }),
  ],
});

// Create namespaced loggers for different modules
export const createLogger = (module: string) => {
  return {
    debug: (message: string, meta = {}) => logger.debug(message, { module, ...meta }),
    info: (message: string, meta = {}) => logger.info(message, { module, ...meta }),
    warn: (message: string, meta = {}) => logger.warn(message, { module, ...meta }),
    error: (message: string, meta = {}) => logger.error(message, { module, ...meta }),
  };
};

// Default logger
export default logger; 