import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

// Types for the crawler
export interface WebPage {
  id: string;
  url: string;
  title: string;
  content: string;
  links: string[];
  timestamp: Date;
}

export interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  includePatterns?: RegExp[];
  excludePatterns?: RegExp[];
  timeout?: number;
}

export class WebsiteCrawler {
  private browser: Browser | null = null;
  private visited = new Set<string>();
  private queue: { url: string; depth: number }[] = [];
  private pages: WebPage[] = [];
  private baseUrl: string;
  private options: Required<CrawlOptions>;

  constructor(baseUrl: string, options?: CrawlOptions) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.options = {
      maxPages: options?.maxPages || 100,
      maxDepth: options?.maxDepth || 3,
      includePatterns: options?.includePatterns || [/^https?:\/\/(www\.)?tzironis\.gr/],
      excludePatterns: options?.excludePatterns || [
        /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|zip|rar)$/i,
        /\?/,
        /#/,
      ],
      timeout: options?.timeout || 30000,
    };
  }

  private isAllowedUrl(url: string): boolean {
    // Skip if already visited
    if (this.visited.has(url)) return false;

    // Check if URL matches include patterns
    const isIncluded = this.options.includePatterns.some(pattern => pattern.test(url));
    if (!isIncluded) return false;

    // Check if URL matches exclude patterns
    const isExcluded = this.options.excludePatterns.some(pattern => pattern.test(url));
    if (isExcluded) return false;

    return true;
  }

  private normalizeUrl(url: string): string {
    try {
      // Convert relative URLs to absolute
      if (url.startsWith('/')) {
        return new URL(url, this.baseUrl).href;
      } else if (!url.startsWith('http')) {
        return new URL(url, this.baseUrl).href;
      }
      return url;
    } catch (error) {
      console.error(`Error normalizing URL ${url}:`, error);
      return '';
    }
  }

  private async extractContent(page: Page): Promise<{
    title: string;
    content: string;
    links: string[];
  }> {
    // Extract page title
    const title = await page.title();

    // Get page content
    const html = await page.content();
    const $ = cheerio.load(html);

    // Remove scripts, styles, and other non-content elements
    $('script, style, meta, link, noscript, svg, path, footer').remove();

    // Extract visible text content, preserving some structure
    const paragraphs = $('p, h1, h2, h3, h4, h5, h6, li')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 0);
    
    // Join paragraphs with line breaks to preserve some structure
    const content = paragraphs.join('\n');

    // Extract links for further crawling
    const links: string[] = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const normalizedUrl = this.normalizeUrl(href);
        if (normalizedUrl && this.isAllowedUrl(normalizedUrl)) {
          links.push(normalizedUrl);
        }
      }
    });

    return { title, content, links };
  }

  private async crawlPage(url: string, depth: number): Promise<void> {
    if (
      this.visited.has(url) ||
      this.pages.length >= this.options.maxPages ||
      depth > this.options.maxDepth
    ) {
      return;
    }

    this.visited.add(url);
    console.log(`Crawling (${depth}/${this.options.maxDepth}): ${url}`);

    try {
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      // Set timeout for navigation
      await page.goto(url, {
        timeout: this.options.timeout,
        waitUntil: 'networkidle2',
      });

      // Wait for content to load
      await page.waitForSelector('body', { timeout: this.options.timeout });

      // Extract content
      const { title, content, links } = await this.extractContent(page);

      // Create page object
      const webPage: WebPage = {
        id: uuidv4(),
        url,
        title,
        content,
        links,
        timestamp: new Date(),
      };

      this.pages.push(webPage);

      // Close the page to free up resources
      await page.close();

      // Add new links to the queue
      for (const link of links) {
        if (!this.visited.has(link)) {
          this.queue.push({ url: link, depth: depth + 1 });
        }
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
    }
  }

  public async crawl(): Promise<WebPage[]> {
    try {
      // Initialize browser
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      // Start with the base URL
      this.queue.push({ url: this.baseUrl, depth: 1 });

      // Process queue
      while (this.queue.length > 0 && this.pages.length < this.options.maxPages) {
        const { url, depth } = this.queue.shift()!;
        await this.crawlPage(url, depth);
      }

      return this.pages;
    } catch (error) {
      console.error('Crawling error:', error);
      return [];
    } finally {
      // Clean up
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }
}

// Usage example:
// const crawler = new WebsiteCrawler('https://tzironis.gr');
// const pages = await crawler.crawl(); 