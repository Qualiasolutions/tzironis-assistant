import MistralClient from '@mistralai/mistralai';
import { withCache } from './cache';
import { createLogger } from '../monitoring/logger';
import { captureException } from '../monitoring/sentry';
import performance from '../monitoring/performance';

const logger = createLogger('mistral-client');

// Available models
export const MISTRAL_MODELS = {
  MISTRAL_TINY: 'mistral-tiny',
  MISTRAL_SMALL: 'mistral-small',
  MISTRAL_MEDIUM: 'mistral-medium',
  MISTRAL_LARGE: 'mistral-large',
} as const;

export type MistralModel = typeof MISTRAL_MODELS[keyof typeof MISTRAL_MODELS];

// Initialize the client
const apiKey = process.env.MISTRAL_API_KEY || '';
const client = new MistralClient(apiKey);

/**
 * Chat completion with caching and monitoring
 * @param messages - Array of message objects with role and content
 * @param options - Configuration options
 * @returns The chat completion response
 */
export const getChatCompletion = async (
  messages: Array<{ role: string; content: string }>,
  options: {
    model?: MistralModel;
    temperature?: number;
    maxTokens?: number;
    enableCache?: boolean;
    cacheTTL?: number;
  } = {}
) => {
  const {
    model = MISTRAL_MODELS.MISTRAL_MEDIUM,
    temperature = 0.7,
    maxTokens = 1000,
    enableCache = true,
    cacheTTL = 60 * 60 // 1 hour
  } = options;

  try {
    // Create the completion function
    const completionFn = async () => {
      return performance.trackExecutionTime(
        'MistralChatCompletion',
        'ai-request',
        async () => {
          const response = await client.chat({
            model,
            messages,
            temperature,
            maxTokens,
          });
          return response;
        },
        { reportToSentry: true, logLevel: 'info' }
      );
    };

    // Use cache if enabled
    if (enableCache) {
      return withCache(
        completionFn,
        messages,
        model,
        { ttl: cacheTTL }
      );
    }

    // Otherwise call directly
    return completionFn();
  } catch (error) {
    logger.error('Error getting chat completion', { 
      error: error instanceof Error ? error.message : String(error),
      model
    });
    captureException(error instanceof Error ? error : new Error(String(error)), {
      model,
      messageCount: messages.length,
    });
    throw error;
  }
};

/**
 * Get embeddings for a text
 * @param texts - Array of texts to embed
 * @param options - Configuration options
 * @returns The embedding vectors
 */
export const getEmbeddings = async (
  texts: string[],
  options: {
    model?: string;
    enableCache?: boolean;
    cacheTTL?: number;
  } = {}
) => {
  const {
    model = 'mistral-embed',
    enableCache = true,
    cacheTTL = 24 * 60 * 60 // 24 hours
  } = options;

  try {
    // Create the embedding function
    const embeddingFn = async () => {
      return performance.trackExecutionTime(
        'MistralEmbedding',
        'ai-embedding',
        async () => {
          const response = await client.embeddings({
            model,
            input: texts,
          });
          return response;
        },
        { reportToSentry: false, logLevel: 'debug' }
      );
    };

    // Use cache if enabled
    if (enableCache) {
      return withCache(
        embeddingFn,
        [{ role: 'system', content: texts.join(' ') }],
        model,
        { ttl: cacheTTL }
      );
    }

    // Otherwise call directly
    return embeddingFn();
  } catch (error) {
    logger.error('Error getting embeddings', { 
      error: error instanceof Error ? error.message : String(error),
      model,
      textCount: texts.length
    });
    captureException(error instanceof Error ? error : new Error(String(error)), {
      model,
      textCount: texts.length,
    });
    throw error;
  }
};

export default {
  getChatCompletion,
  getEmbeddings,
  MISTRAL_MODELS,
}; 