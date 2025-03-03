import NodeCache from 'node-cache';
import { createHash } from 'crypto';
import { createLogger } from '../monitoring/logger';

const logger = createLogger('llm-cache');

// Interface for cache options
interface CacheOptions {
  ttl: number; // Time to live in seconds
  checkperiod?: number; // Period for clearing expired keys
  maxKeys?: number; // Maximum number of keys in cache
}

// Default cache options
const defaultOptions: CacheOptions = {
  ttl: 60 * 60, // 1 hour default TTL
  checkperiod: 60 * 5, // Check for expired keys every 5 minutes
  maxKeys: 5000, // Store up to 5000 items
};

// Create the cache instance
const cache = new NodeCache({
  stdTTL: defaultOptions.ttl,
  checkperiod: defaultOptions.checkperiod,
  maxKeys: defaultOptions.maxKeys,
  useClones: false, // For better performance
});

/**
 * Generates a cache key from messages
 * @param messages - Array of message objects
 * @param model - The model being used
 * @returns A unique hash for the conversation
 */
export const generateCacheKey = (
  messages: Array<{ role: string; content: string }>,
  model: string
): string => {
  // Create a stable string representation of the messages
  const messagesStr = JSON.stringify(messages);
  
  // Create a hash of the messages and model
  return createHash('sha256')
    .update(`${model}:${messagesStr}`)
    .digest('hex');
};

/**
 * Wrapper for LLM calls with caching
 * @param fn - The LLM call function to wrap with caching
 * @param messages - The messages to send to the LLM
 * @param model - The model name
 * @param options - Cache options
 * @returns The LLM response
 */
export const withCache = async <T>(
  fn: () => Promise<T>,
  messages: Array<{ role: string; content: string }>,
  model: string,
  options: Partial<CacheOptions> = {}
): Promise<T> => {
  const cacheKey = generateCacheKey(messages, model);
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Try to get from cache first
  const cachedResult = cache.get<T>(cacheKey);
  
  if (cachedResult) {
    logger.debug('Cache hit', { cacheKey, model });
    return cachedResult;
  }
  
  // If not in cache, call the function
  logger.debug('Cache miss', { cacheKey, model });
  const result = await fn();
  
  // Store in cache with the provided TTL
  cache.set(cacheKey, result, mergedOptions.ttl);
  logger.debug('Cached result', { cacheKey, model, ttl: mergedOptions.ttl });
  
  return result;
};

/**
 * Manually invalidate a cache entry
 * @param messages - The messages used in the original request
 * @param model - The model used in the original request
 * @returns boolean indicating if a key was deleted
 */
export const invalidateCache = (
  messages: Array<{ role: string; content: string }>,
  model: string
): boolean => {
  const cacheKey = generateCacheKey(messages, model);
  const deleted = cache.del(cacheKey);
  
  if (deleted > 0) {
    logger.debug('Invalidated cache', { cacheKey, model });
    return true;
  }
  
  return false;
};

/**
 * Helper to get cache stats
 * @returns Cache statistics
 */
export const getCacheStats = () => {
  return cache.getStats();
};

export default {
  withCache,
  invalidateCache,
  getCacheStats,
  generateCacheKey,
}; 