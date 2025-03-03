import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';
import { getEmbeddings } from '../ai/mistral-client';
import { createLogger } from '../monitoring/logger';
import { captureException } from '../monitoring/sentry';
import performance from '../monitoring/performance';
import chunking, { ChunkingOptions } from './chunking';

const logger = createLogger('pinecone-adapter');

// Document metadata type
export interface DocumentMetadata {
  url?: string;
  title?: string;
  source?: string;
  created?: string;
  updated?: string;
  type?: string;
  [key: string]: any;
}

// Document type for storage and retrieval
export interface Document {
  id: string;
  text: string;
  metadata: DocumentMetadata;
}

// Search result type
export interface SearchResult {
  id: string;
  text: string;
  metadata: DocumentMetadata;
  score: number;
}

// Configuration for PineconeAdapter
export interface PineconeAdapterConfig {
  apiKey: string;
  environment?: string;
  indexName: string;
  namespace?: string;
  dimension?: number;
  chunkingOptions?: Partial<ChunkingOptions>;
}

/**
 * Adapter for interacting with Pinecone vector database
 */
export class PineconeAdapter {
  private pinecone: Pinecone;
  private indexName: string;
  private namespace: string;
  private dimension: number;
  private chunkingOptions: ChunkingOptions;
  
  /**
   * Initialize the PineconeAdapter
   * @param config - Configuration for Pinecone
   */
  constructor(config: PineconeAdapterConfig) {
    const {
      apiKey,
      environment = 'gcp-starter',
      indexName,
      namespace = 'default',
      dimension = 1536,
      chunkingOptions = {},
    } = config;
    
    this.pinecone = new Pinecone({ 
      apiKey
    });
    
    this.indexName = indexName;
    this.namespace = namespace;
    this.dimension = dimension;
    this.chunkingOptions = { ...chunking.DEFAULT_CHUNKING_OPTIONS, ...chunkingOptions };
    
    logger.info('PineconeAdapter initialized', {
      indexName,
      namespace,
      dimension,
    });
  }
  
  /**
   * Get the Pinecone index
   * @returns The Pinecone index
   */
  private getIndex() {
    return this.pinecone.index(this.indexName);
  }
  
  /**
   * Upsert documents to Pinecone
   * @param documents - Array of documents to upsert
   * @returns Number of vectors upserted
   */
  async upsertDocuments(documents: Document[]): Promise<number> {
    try {
      return await performance.trackExecutionTime(
        'PineconeUpsert',
        'vectordb',
        async () => {
          let totalVectors = 0;
          
          // Process documents in batches to avoid rate limits
          const batchSize = 100;
          
          for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            const records: PineconeRecord[] = [];
            
            // Process each document into chunks
            for (const doc of batch) {
              const docChunks = chunking.splitTextIntoChunks(doc.text, this.chunkingOptions);
              
              // Get embeddings for all chunks at once
              const embeddings = await this.getEmbeddingsForTexts(docChunks);
              
              // Create records for each chunk
              for (let j = 0; j < docChunks.length; j++) {
                const chunkText = docChunks[j];
                const embedding = embeddings[j];
                
                if (!embedding) {
                  logger.warn('Missing embedding for chunk', { docId: doc.id, chunkIndex: j });
                  continue;
                }
                
                const record: PineconeRecord = {
                  id: `${doc.id}-chunk-${j}`,
                  values: embedding,
                  metadata: {
                    ...doc.metadata,
                    text: chunkText,
                    chunk_id: j,
                    document_id: doc.id,
                  },
                };
                
                records.push(record);
              }
            }
            
            // Upsert records to Pinecone
            if (records.length > 0) {
              await this.getIndex().namespace(this.namespace).upsert(records);
              totalVectors += records.length;
              
              logger.debug(`Upserted ${records.length} vectors`, {
                batch: i / batchSize + 1,
                totalBatches: Math.ceil(documents.length / batchSize),
              });
            }
          }
          
          logger.info(`Upserted ${totalVectors} vectors for ${documents.length} documents`);
          return totalVectors;
        },
        { reportToSentry: true, logLevel: 'info' }
      );
    } catch (error) {
      logger.error('Error upserting documents', {
        error: error instanceof Error ? error.message : String(error),
        documentCount: documents.length,
      });
      captureException(error instanceof Error ? error : new Error(String(error)), {
        documentCount: documents.length,
      });
      throw error;
    }
  }
  
  /**
   * Get embeddings for an array of texts
   * @param texts - Array of texts to embed
   * @returns Array of embeddings
   */
  private async getEmbeddingsForTexts(texts: string[]): Promise<number[][]> {
    try {
      const response = await getEmbeddings(texts);
      return response.data.map(item => item.embedding);
    } catch (error) {
      logger.error('Error getting embeddings', {
        error: error instanceof Error ? error.message : String(error),
        textCount: texts.length,
      });
      throw error;
    }
  }
  
  /**
   * Search for similar documents
   * @param query - Search query text
   * @param options - Search options
   * @returns Array of search results
   */
  async search(
    query: string,
    options: {
      limit?: number;
      filter?: Record<string, any>;
      includeMetadata?: boolean;
      minScore?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const {
      limit = 5,
      filter = {},
      includeMetadata = true,
      minScore = 0.7,
    } = options;
    
    try {
      return await performance.trackExecutionTime(
        'PineconeSearch',
        'vectordb',
        async () => {
          // Get embedding for query
          const embeddings = await this.getEmbeddingsForTexts([query]);
          const queryEmbedding = embeddings[0];
          
          if (!queryEmbedding) {
            throw new Error('Failed to generate embedding for query');
          }
          
          // Perform vector search
          const results = await this.getIndex()
            .namespace(this.namespace)
            .query({
              vector: queryEmbedding,
              topK: limit,
              includeMetadata: true,
              filter,
            });
          
          // Process search results
          const searchResults: SearchResult[] = [];
          
          for (const match of results.matches) {
            if (match.score && match.score >= minScore && match.metadata) {
              const metadata = { ...match.metadata };
              const text = metadata.text as string;
              
              // Remove text from metadata as it's included separately
              delete metadata.text;
              
              searchResults.push({
                id: match.id,
                text,
                metadata: metadata as DocumentMetadata,
                score: match.score,
              });
            }
          }
          
          logger.debug(`Found ${searchResults.length} search results for query`, {
            queryLength: query.length,
            resultCount: searchResults.length,
          });
          
          return searchResults;
        },
        { reportToSentry: false, logLevel: 'debug' }
      );
    } catch (error) {
      logger.error('Error searching documents', {
        error: error instanceof Error ? error.message : String(error),
        query,
      });
      captureException(error instanceof Error ? error : new Error(String(error)), {
        query,
      });
      throw error;
    }
  }
  
  /**
   * Delete documents by id or filter
   * @param options - Delete options
   * @returns Number of deleted documents
   */
  async deleteDocuments(
    options: {
      ids?: string[];
      deleteAll?: boolean;
      filter?: Record<string, any>;
    }
  ): Promise<number> {
    const { ids, deleteAll, filter } = options;
    
    try {
      if (deleteAll) {
        // Delete all vectors in the namespace
        await this.getIndex().namespace(this.namespace).deleteAll();
        logger.info('Deleted all vectors in namespace', { namespace: this.namespace });
        return -1; // Unknown count
      } else if (ids && ids.length > 0) {
        // Delete by IDs
        const expandedIds: string[] = [];
        
        // Each document might have multiple chunks
        for (const id of ids) {
          // First get all vectors with this document_id
          const results = await this.getIndex()
            .namespace(this.namespace)
            .query({
              vector: Array(this.dimension).fill(0), // Dummy vector
              topK: 100,
              includeMetadata: true,
              filter: { document_id: id },
            });
          
          // Collect all chunk IDs
          const chunkIds = results.matches.map(match => match.id);
          expandedIds.push(...chunkIds);
          
          // Also add potential direct ID format
          for (let i = 0; i < 20; i++) { // Assume max 20 chunks per document
            expandedIds.push(`${id}-chunk-${i}`);
          }
        }
        
        // Delete all collected IDs
        if (expandedIds.length > 0) {
          await this.getIndex().namespace(this.namespace).deleteMany(expandedIds);
          logger.info(`Deleted vectors for ${ids.length} documents`, {
            documentIds: ids,
            vectorCount: expandedIds.length,
          });
          return ids.length;
        }
        
        return 0;
      } else if (filter) {
        // Delete by filter
        // Note: The Pinecone JS SDK doesn't directly support deleteMany with filter
        // We first need to query for matching IDs, then delete them
        
        const results = await this.getIndex()
          .namespace(this.namespace)
          .query({
            vector: Array(this.dimension).fill(0), // Dummy vector
            topK: 10000, // Get as many as possible
            includeMetadata: false,
            filter,
          });
        
        const matchIds = results.matches.map(match => match.id);
        
        if (matchIds.length > 0) {
          await this.getIndex().namespace(this.namespace).deleteMany(matchIds);
          logger.info(`Deleted ${matchIds.length} vectors by filter`, { filter });
          return matchIds.length;
        }
        
        return 0;
      }
      
      return 0;
    } catch (error) {
      logger.error('Error deleting documents', {
        error: error instanceof Error ? error.message : String(error),
      });
      captureException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

export default PineconeAdapter; 