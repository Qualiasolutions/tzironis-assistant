import PineconeAdapter, {
  type Document,
  type DocumentMetadata,
  type SearchResult,
  type PineconeAdapterConfig
} from './pinecone-adapter';
import chunking, {
  type ChunkingOptions,
  DEFAULT_CHUNKING_OPTIONS,
  splitTextIntoChunks,
  calculateOptimalChunkSize
} from './chunking';
import { createLogger } from '../monitoring/logger';

const logger = createLogger('vectordb');

// Function to create a vector database adapter
export const createVectorStore = (config: PineconeAdapterConfig) => {
  logger.info('Creating vector store', { indexName: config.indexName });
  return new PineconeAdapter(config);
};

// Function to split text content into optimized chunks for embedding
export const prepareContentForEmbedding = (
  content: string,
  options: Partial<ChunkingOptions> = {}
) => {
  return splitTextIntoChunks(content, options);
};

// Function to generate a unique document ID
export const generateDocumentId = (
  source: string,
  identifier: string
): string => {
  return `${source}-${identifier}`.replace(/[^a-zA-Z0-9-_]/g, '-');
};

// Re-export types and utilities
export { PineconeAdapter, DEFAULT_CHUNKING_OPTIONS, calculateOptimalChunkSize };
export type {
  Document,
  DocumentMetadata,
  SearchResult,
  PineconeAdapterConfig,
  ChunkingOptions
};

export default {
  createVectorStore,
  prepareContentForEmbedding,
  generateDocumentId,
  chunking
}; 