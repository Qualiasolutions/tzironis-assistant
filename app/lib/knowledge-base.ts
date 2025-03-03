import { Pinecone } from "@pinecone-database/pinecone";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { v4 as uuidv4 } from "uuid";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MistralEmbeddings } from "./mistral-embeddings";
import { Embeddings } from "@langchain/core/embeddings";
import { parse as parseCSV } from 'csv-parse/sync'; // Import CSV parser

interface CrawlStats {
  pagesProcessed: number;
  chunksStored: number;
}

export interface FileProcessResult {
  filename: string;
  chunksStored: number;
}

export class KnowledgeBase {
  private pineconeClient: Pinecone | null = null;
  private embeddings: Embeddings;
  private namespace: string;
  private index: string;
  private maxPages: number;
  private maxDepth: number;
  private visitedUrls: Set<string>;
  private stats: CrawlStats;
  private pineconeApiKey: string;
  private connectionInitialized = false;
  private initializationInProgress = false;
  private initializationError: Error | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  constructor({
    pineconeApiKey,
    pineconeIndex,
    openaiApiKey,
    mistralApiKey,
    namespace = "tzironis-kb-mistral",
    maxPages = 50,
    maxDepth = 3,
  }: {
    pineconeApiKey: string;
    pineconeIndex: string;
    openaiApiKey?: string;
    mistralApiKey?: string;
    namespace?: string;
    maxPages?: number;
    maxDepth?: number;
  }) {
    this.pineconeApiKey = pineconeApiKey;
    
    // Use Mistral embeddings if available, otherwise fallback to OpenAI
    if (mistralApiKey) {
      this.embeddings = new MistralEmbeddings({
        apiKey: mistralApiKey,
      });
    } else if (openaiApiKey) {
      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: openaiApiKey,
        modelName: "text-embedding-3-small",
      });
    } else {
      throw new Error("Either Mistral or OpenAI API key is required for embeddings");
    }
    
    this.namespace = namespace;
    this.index = pineconeIndex;
    this.maxPages = maxPages;
    this.maxDepth = maxDepth;
    this.visitedUrls = new Set<string>();
    this.stats = { pagesProcessed: 0, chunksStored: 0 };

    // Defer Pinecone initialization until first use
    this.initPineconeClient().catch(error => {
      console.warn("Initial Pinecone connection failed, will retry on first use:", error.message);
    });
  }

  private async initPineconeClient(forceRetry = false): Promise<Pinecone> {
    // If already initialized and not forcing a retry, return the client
    if (this.pineconeClient && this.connectionInitialized && !forceRetry) {
      return this.pineconeClient;
    }
    
    // If initialization is already in progress, wait for it to complete
    if (this.initializationInProgress) {
      // Wait for initialization to complete (poll every 100ms)
      let attempts = 0;
      while (this.initializationInProgress && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (this.pineconeClient && this.connectionInitialized) {
        return this.pineconeClient;
      } else if (this.initializationError) {
        throw this.initializationError;
      }
    }
    
    // Start initialization
    this.initializationInProgress = true;
    this.initializationError = null;
    
    try {
      // Initialize Pinecone client with retry logic
      let retries = 0;
      let lastError: Error | null = null;
      
      while (retries < this.maxRetries) {
        try {
          this.pineconeClient = new Pinecone({
            apiKey: this.pineconeApiKey,
          });
          
          // Test the connection
          const indexes = await this.pineconeClient.listIndexes();
          const indexCount = Object.keys(indexes.indexes || {}).length;
          console.log(`Pinecone connection successful. Available indexes: ${indexCount}`);
          
          this.connectionInitialized = true;
          return this.pineconeClient;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`Pinecone connection attempt ${retries + 1} failed:`, lastError.message);
          retries++;
          
          if (retries < this.maxRetries) {
            // Exponential backoff
            const delay = this.retryDelay * Math.pow(2, retries - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // All retries failed
      if (lastError) {
        this.initializationError = lastError;
        throw lastError;
      } else {
        const error = new Error("Failed to initialize Pinecone client after multiple attempts");
        this.initializationError = error;
        throw error;
      }
    } finally {
      this.initializationInProgress = false;
    }
  }

  // Get a Pinecone index with error handling
  private async getPineconeIndex() {
    try {
      const client = await this.initPineconeClient();
      return client.index(this.index);
    } catch (error) {
      console.error("Error getting Pinecone index:", error);
      throw error;
    }
  }

  // Wrapper for vector operations with fallback
  private async withVectorStore<T>(operation: (store: PineconeStore) => Promise<T>, fallback: T): Promise<T> {
    try {
      const pineconeIndex = await this.getPineconeIndex();
      const vectorStore = await PineconeStore.fromExistingIndex(this.embeddings, {
        pineconeIndex,
        namespace: this.namespace,
      });
      return await operation(vectorStore);
    } catch (error) {
      console.error("Vector store operation failed:", error);
      return fallback;
    }
  }

  /**
   * Crawls a website starting from the given URL and processes the content
   * for the knowledge base
   */
  async crawlAndProcess(startUrl: string): Promise<CrawlStats> {
    // Reset stats and visited URLs
    this.stats = { pagesProcessed: 0, chunksStored: 0 };
    this.visitedUrls.clear();

    // Normalize the start URL
    const normalizedStartUrl = this.normalizeUrl(startUrl);
    const domain = new URL(normalizedStartUrl).hostname;

    // Start crawling
    await this.crawl(normalizedStartUrl, domain, 0);

    return this.stats;
  }

  /**
   * Recursive function to crawl pages within the specified domain
   */
  private async crawl(
    url: string,
    domain: string,
    depth: number
  ): Promise<void> {
    // Check if we've reached our limits
    if (
      depth > this.maxDepth ||
      this.stats.pagesProcessed >= this.maxPages ||
      this.visitedUrls.has(url)
    ) {
      return;
    }

    // Mark as visited
    this.visitedUrls.add(url);

    try {
      // Launch headless browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      
      // Set timeout to prevent hanging on slow pages
      await page.setDefaultNavigationTimeout(30000);
      
      // Navigate to the URL
      await page.goto(url, { waitUntil: "networkidle2" });
      
      // Get the HTML content
      const content = await page.content();
      
      // Process the page content
      await this.processPage(url, content);
      
      // Increment pages processed count
      this.stats.pagesProcessed++;
      
      // If we're not at max depth, extract links and continue crawling
      if (depth < this.maxDepth && this.stats.pagesProcessed < this.maxPages) {
        const links = await this.extractLinks(content, domain);
        
        // Close the browser before starting new crawls
        await browser.close();
        
        // Crawl each link
        for (const link of links) {
          if (this.stats.pagesProcessed < this.maxPages) {
            await this.crawl(link, domain, depth + 1);
          } else {
            break;
          }
        }
      } else {
        await browser.close();
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
    }
  }

  /**
   * Process a page's content, extract text, and store in knowledge base
   */
  private async processPage(url: string, html: string): Promise<void> {
    try {
      const $ = cheerio.load(html);
      
      // Remove unwanted elements
      $("script, style, noscript, svg, img, video, audio, iframe, nav, footer").remove();
      
      // Get page title
      const title = $("title").text().trim() || url;
      
      // Get meta description
      const description = $('meta[name="description"]').attr("content") || "";
      
      // Extract main content
      const bodyText = $("body").text().replace(/\s+/g, " ").trim();
      
      // Skip if no meaningful content
      if (bodyText.length < 100) {
        return;
      }
      
      // Create chunks from the content
      const chunks = this.createChunks(bodyText, title, description, url);
      
      // Store chunks in vector database
      await this.storeChunks(chunks);
      
      // Update stats
      this.stats.chunksStored += chunks.length;
    } catch (error) {
      console.error(`Error processing ${url}:`, error);
    }
  }

  /**
   * Extract links from HTML content that belong to the same domain
   */
  private extractLinks(html: string, domain: string): string[] {
    const $ = cheerio.load(html);
    const links: string[] = [];
    
    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (!href) return;
      
      // Try to convert to absolute URL
      try {
        const url = new URL(href, $("base").attr("href") || $("link[rel='canonical']").attr("href"));
        const absoluteUrl = url.toString();
        
        // Only include links from the same domain that we haven't visited
        if (
          url.hostname === domain &&
          !this.visitedUrls.has(absoluteUrl) &&
          !absoluteUrl.includes("#") &&  // Avoid anchor links
          !absoluteUrl.match(/\.(jpg|jpeg|png|gif|pdf|zip|doc|xls|ppt|mp3|mp4)$/i)  // Avoid media files
        ) {
          links.push(this.normalizeUrl(absoluteUrl));
        }
      } catch (error) {
        // Ignore invalid URLs
      }
    });
    
    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Create chunks from the page content
   */
  private createChunks(
    text: string,
    title: string,
    description: string,
    url: string
  ): Document[] {
    // Add metadata to the beginning of the text
    const fullText = `${title}\n${description}\n\n${text}`;
    
    // Split into chunks (max 1000 chars per chunk with 200 char overlap)
    const chunkSize = 1000;
    const overlap = 200;
    const chunks: Document[] = [];
    
    for (let i = 0; i < fullText.length; i += chunkSize - overlap) {
      const chunk = fullText.slice(i, i + chunkSize);
      
      // Skip small chunks at the end
      if (chunk.length < 100 && chunks.length > 0) continue;
      
      chunks.push(
        new Document({
          pageContent: chunk,
          metadata: {
            id: uuidv4(),
            url,
            title,
            chunkIndex: chunks.length,
            totalChunks: Math.ceil(fullText.length / (chunkSize - overlap)),
            source: "web",
          },
        })
      );
    }
    
    return chunks;
  }

  /**
   * Store chunks in the vector database
   */
  private async storeChunks(chunks: Document[]): Promise<void> {
    if (chunks.length === 0) return;
    
    try {
      // Get the Pinecone index using our resilient method
      const pineconeIndex = await this.getPineconeIndex();
      
      // Store documents in Pinecone
      await PineconeStore.fromDocuments(chunks, this.embeddings, {
        pineconeIndex,
        namespace: this.namespace,
      });
    } catch (error) {
      console.error("Error storing chunks:", error);
      // Throw error but ensure it's properly caught by the caller
      throw new Error(`Failed to store chunks in Pinecone: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process a file and add it to the knowledge base
   */
  async processFile(
    filename: string,
    content: string,
    fileType: string
  ): Promise<FileProcessResult> {
    try {
      let processedContent = content;
      
      // Special handling for CSV files
      if (filename.endsWith('.csv')) {
        try {
          // Parse CSV content
          const records = parseCSV(content, {
            columns: true, // Use first row as column names
            skip_empty_lines: true,
            trim: true,
          });
          
          if (records && records.length > 0) {
            // Convert CSV records to a more readable format
            processedContent = records.map((record: any, index: number) => {
              // Create a string representation of each row
              let rowContent = `Item ${index + 1}:\n`;
              
              // Add each column as a key-value pair
              for (const [key, value] of Object.entries(record)) {
                if (value && String(value).trim()) {
                  // If the value contains HTML, try to extract plain text
                  const cleanValue = String(value).includes('<') && String(value).includes('>')
                    ? this.extractTextFromHtml(String(value))
                    : value;
                    
                  rowContent += `${key}: ${cleanValue}\n`;
                }
              }
              
              return rowContent;
            }).join('\n\n');
          }
        } catch (csvError) {
          console.error(`Error parsing CSV file ${filename}:`, csvError);
          // Fall back to treating the file as plain text
        }
      }
      
      // Create a text splitter
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      
      // Split the text into chunks
      const rawChunks = await splitter.createDocuments([processedContent]);
      
      // Add metadata to chunks
      const chunks = rawChunks.map((chunk) => 
        new Document({
          pageContent: chunk.pageContent,
          metadata: {
            id: uuidv4(),
            filename,
            fileType,
            title: filename,
            source: "file",
          },
        })
      );
      
      // Store the chunks
      await this.storeChunks(chunks);
      
      return {
        filename,
        chunksStored: chunks.length,
      };
    } catch (error) {
      console.error(`Error processing file ${filename}:`, error);
      // Return partial result instead of failing
      return {
        filename,
        chunksStored: 0,
      };
    }
  }

  /**
   * Extract plain text from HTML content
   */
  private extractTextFromHtml(html: string): string {
    try {
      const $ = cheerio.load(html);
      // Remove script and style tags
      $('script, style').remove();
      // Get text and preserve some structure
      return $('body').text().replace(/\s+/g, ' ').trim();
    } catch (error) {
      // On error, return the original HTML string
      return html;
    }
  }

  /**
   * Delete all documents in the knowledge base
   */
  async clearAll(): Promise<void> {
    try {
      const pineconeIndex = await this.getPineconeIndex();
      await pineconeIndex.namespace(this.namespace).deleteAll();
    } catch (error) {
      console.error("Error clearing knowledge base:", error);
      throw new Error(`Failed to clear knowledge base: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search the knowledge base for relevant information
   */
  async search(query: string, limit: number = 5): Promise<any[]> {
    return this.withVectorStore(
      async (vectorStore) => {
        // Search with score
        const rawResults = await vectorStore.similaritySearchWithScore(query, limit);
        
        // Process and return results
        return rawResults.map(([doc, score]) => ({
          pageContent: doc.pageContent,
          metadata: doc.metadata,
          similarity: score,
        }));
      },
      [] // Return empty array as fallback
    );
  }

  /**
   * List all unique sources in the knowledge base
   */
  async listSources(): Promise<{ sources: { url?: string; filename?: string; type: string }[] }> {
    return this.withVectorStore(
      async (vectorStore) => {
        // Query a few documents to examine metadata
        const results = await vectorStore.similaritySearch("information", 100);
        
        // Extract unique sources
        const sources = new Map<string, { url?: string; filename?: string; type: string }>();
        
        results.forEach(doc => {
          if (doc.metadata.source === "web" && doc.metadata.url) {
            sources.set(doc.metadata.url, {
              url: doc.metadata.url,
              type: "web",
            });
          } else if (doc.metadata.source === "file" && doc.metadata.filename) {
            sources.set(doc.metadata.filename, {
              filename: doc.metadata.filename,
              type: "file",
            });
          }
        });
        
        return {
          sources: Array.from(sources.values()),
        };
      },
      { sources: [] } // Return empty sources as fallback
    );
  }

  /**
   * Normalize URLs to avoid duplicates
   */
  private normalizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      
      // Remove trailing slash
      let normalized = parsedUrl.origin + parsedUrl.pathname.replace(/\/$/, "");
      
      // Keep essential query parameters if needed
      if (parsedUrl.search) {
        normalized += parsedUrl.search;
      }
      
      return normalized;
    } catch (error) {
      return url; // Return original if parsing fails
    }
  }
} 