import { createLogger } from '../monitoring/logger';

const logger = createLogger('chunking');

/**
 * Configuration options for chunking text
 */
export interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
  separator?: string;
  minChunkSize: number;
  preserveParagraphs?: boolean;
}

/**
 * Default chunking options
 */
export const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  chunkSize: 1000,
  chunkOverlap: 200,
  separator: '\n',
  minChunkSize: 100,
  preserveParagraphs: true,
};

/**
 * Split text into chunks with overlap for better semantic understanding
 * @param text - Text to split into chunks
 * @param options - Chunking configuration
 * @returns Array of text chunks
 */
export const splitTextIntoChunks = (
  text: string,
  options: Partial<ChunkingOptions> = {}
): string[] => {
  const {
    chunkSize,
    chunkOverlap,
    separator,
    minChunkSize,
    preserveParagraphs,
  } = { ...DEFAULT_CHUNKING_OPTIONS, ...options };

  // Remove excess whitespace
  const cleanedText = text.trim().replace(/\s+/g, ' ');
  
  // If text is smaller than chunk size, return it as a single chunk
  if (cleanedText.length <= chunkSize) {
    return [cleanedText];
  }
  
  let chunks: string[] = [];
  
  // If we want to preserve paragraph structure
  if (preserveParagraphs) {
    // Split by paragraphs (separated by line breaks)
    const paragraphs = cleanedText.split(/\n\s*\n/);
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed chunk size
      if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length >= minChunkSize) {
        chunks.push(currentChunk.trim());
        
        // Start a new chunk with overlap
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.ceil(chunkOverlap / 5)); // Approximate words in overlap
        currentChunk = overlapWords.join(' ') + ' ' + paragraph;
      } else {
        // Add paragraph to current chunk
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    // Add the last chunk if it's not empty
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
  } else {
    // Split by custom separator
    const segments = cleanedText.split(separator || '\n');
    
    let currentChunk = '';
    
    for (const segment of segments) {
      // If adding this segment would exceed chunk size
      if (currentChunk.length + segment.length > chunkSize && currentChunk.length >= minChunkSize) {
        chunks.push(currentChunk.trim());
        
        // Start a new chunk with overlap
        const startIndex = Math.max(0, currentChunk.length - chunkOverlap);
        currentChunk = currentChunk.substring(startIndex) + (separator || '\n') + segment;
      } else {
        // Add segment to current chunk
        currentChunk += (currentChunk ? (separator || '\n') : '') + segment;
      }
    }
    
    // Add the last chunk if it's not empty
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
  }
  
  // Post-process chunks: merge small chunks and split overly large ones
  chunks = postProcessChunks(chunks, minChunkSize, chunkSize);
  
  logger.debug(`Split text into ${chunks.length} chunks`, {
    textLength: cleanedText.length,
    chunkCount: chunks.length,
  });
  
  return chunks;
};

/**
 * Post-process chunks to fix size issues
 * @param chunks - Initial chunks
 * @param minSize - Minimum chunk size
 * @param maxSize - Maximum chunk size
 * @returns Processed chunks
 */
const postProcessChunks = (
  chunks: string[],
  minSize: number,
  maxSize: number
): string[] => {
  const result: string[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // If chunk is too small and not the last one, combine with next chunk
    if (chunk.length < minSize && i < chunks.length - 1) {
      chunks[i + 1] = chunk + '\n\n' + chunks[i + 1];
      continue;
    }
    
    // If chunk is too large, split it
    if (chunk.length > maxSize) {
      // Simple split by sentences to avoid cutting in the middle of ideas
      const sentences = chunk.match(/[^.!?]+[.!?]+/g) || [chunk];
      let currentPiece = '';
      
      for (const sentence of sentences) {
        if (currentPiece.length + sentence.length > maxSize) {
          result.push(currentPiece.trim());
          currentPiece = sentence;
        } else {
          currentPiece += sentence;
        }
      }
      
      if (currentPiece.trim().length > 0) {
        result.push(currentPiece.trim());
      }
    } else {
      result.push(chunk);
    }
  }
  
  return result;
};

/**
 * Calculate optimal chunk size based on token limits
 * @param maxTokens - Maximum tokens for the model
 * @param avgTokensPerChar - Average number of tokens per character (typically 0.25-0.33)
 * @returns Optimal chunk size in characters
 */
export const calculateOptimalChunkSize = (
  maxTokens: number,
  avgTokensPerChar: number = 0.25
): number => {
  // Reserve tokens for metadata and some buffer
  const reservedTokens = 100;
  const availableTokens = maxTokens - reservedTokens;
  
  // Calculate optimal chunk size
  return Math.floor(availableTokens / avgTokensPerChar);
};

export default {
  splitTextIntoChunks,
  calculateOptimalChunkSize,
  DEFAULT_CHUNKING_OPTIONS,
}; 