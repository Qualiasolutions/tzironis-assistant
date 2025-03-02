import MistralClient from '@mistralai/mistralai';
import { Embeddings } from "@langchain/core/embeddings";
import { chunkArray } from "@langchain/core/utils/chunk_array";

/**
 * A LangChain compatible embeddings class that uses Mistral API
 */
export class MistralEmbeddings implements Embeddings {
  private client: MistralClient;
  private model: string;
  private batchSize: number;
  caller: any;

  constructor({
    apiKey,
    model = "mistral-embed",
    batchSize = 10,
  }: {
    apiKey: string;
    model?: string;
    batchSize?: number;
  }) {
    this.client = new MistralClient(apiKey);
    this.model = model;
    this.batchSize = batchSize;
    this.caller = {};
  }

  /**
   * Get embeddings for multiple texts
   */
  async embedDocuments(texts: string[]): Promise<number[][]> {
    const batches = chunkArray(texts, this.batchSize);
    const embeddings: number[][] = [];

    for (const batch of batches) {
      try {
        const response = await this.client.embeddings({
          model: this.model,
          input: batch,
        });

        embeddings.push(...response.data.map((item) => item.embedding));
      } catch (error) {
        console.error("Error generating embeddings:", error);
        throw error;
      }
    }

    return embeddings;
  }

  /**
   * Get embedding for a single text
   */
  async embedQuery(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings({
        model: this.model,
        input: [text],
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw error;
    }
  }
} 