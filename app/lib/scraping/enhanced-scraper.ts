import puppeteer, { Browser, Page } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createLogger } from '../monitoring/logger';
import { captureException } from '../monitoring/sentry';
import performance from '../monitoring/performance';
import userAgentRotator from './user-agent-rotator';
import ProxyManager, { Proxy } from './proxy-manager';
import * as cheerio from 'cheerio';
import pRetry from 'p-retry';

// Add stealth plugin to puppeteer
puppeteerExtra.use(StealthPlugin());

const logger = createLogger('enhanced-scraper');

/**
 * Configuration options for the scraper
 */
export interface ScraperOptions {
  headless?: boolean;
  timeout?: number;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  proxy?: Proxy;
  userAgent?: string;
  cookies?: any[];
  viewport?: {
    width: number;
    height: number;
  };
  retries?: number;
  maxConcurrency?: number;
  cacheHtml?: boolean;
  followRedirects?: boolean;
  interceptMedia?: boolean;
  interceptFonts?: boolean;
  interceptStyles?: boolean;
  interceptImages?: boolean;
}

/**
 * Default scraper options
 */
export const DEFAULT_SCRAPER_OPTIONS: ScraperOptions = {
  headless: true,
  timeout: 30000,
  waitUntil: 'networkidle2',
  viewport: {
    width: 1920,
    height: 1080,
  },
  retries: 3,
  maxConcurrency: 5,
  cacheHtml: true,
  followRedirects: true,
  interceptMedia: true,
  interceptFonts: true,
  interceptStyles: false,
  interceptImages: true,
};

/**
 * Result of a scraping operation
 */
export interface ScrapingResult {
  url: string;
  html: string;
  status: number;
  headers: Record<string, string>;
  cookies: any[];
  title: string;
  links: string[];
  duration: number;
  userAgent?: string;
  proxy?: Proxy;
  error?: string;
}

/**
 * Enhanced web scraper with user agent rotation, proxy support, and error handling
 */
export class EnhancedScraper {
  private browser: Browser | null = null;
  private options: ScraperOptions;
  private proxyManager: ProxyManager;
  private htmlCache: Map<string, { html: string; timestamp: number }> = new Map();
  private cacheTtl = 60 * 60 * 1000; // 1 hour
  
  /**
   * Create a new EnhancedScraper
   * @param options - Scraper configuration options
   * @param proxyManager - Optional proxy manager for rotation
   */
  constructor(options: Partial<ScraperOptions> = {}, proxyManager?: ProxyManager) {
    this.options = { ...DEFAULT_SCRAPER_OPTIONS, ...options };
    this.proxyManager = proxyManager || new ProxyManager();
    
    logger.info('EnhancedScraper initialized', {
      headless: this.options.headless,
      timeout: this.options.timeout,
      retries: this.options.retries,
    });
  }
  
  /**
   * Initialize the browser
   */
  async initBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }
    
    // Get proxy if available
    const proxy = this.options.proxy || this.proxyManager.getNextProxy();
    
    // Get user agent if not provided
    const userAgent = this.options.userAgent || userAgentRotator.getRandomUserAgent();
    
    // Launch browser with options
    const launchOptions: any = {
      headless: this.options.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
      ignoreHTTPSErrors: true,
      defaultViewport: this.options.viewport,
    };
    
    // Add proxy if available
    if (proxy) {
      const proxyString = this.proxyManager.getProxyString(proxy);
      launchOptions.args.push(`--proxy-server=${proxyString}`);
      
      logger.debug('Using proxy', {
        proxy: `${proxy.host}:${proxy.port}`,
      });
    }
    
    try {
      this.browser = await puppeteerExtra.launch(launchOptions);
      
      logger.debug('Browser launched', {
        userAgent,
        proxy: proxy ? `${proxy.host}:${proxy.port}` : 'none',
      });
      
      return this.browser;
    } catch (error) {
      logger.error('Failed to launch browser', {
        error: error instanceof Error ? error.message : String(error),
      });
      captureException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  
  /**
   * Close the browser
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      
      logger.debug('Browser closed');
    }
  }
  
  /**
   * Scrape a URL with retries and error handling
   * @param url - URL to scrape
   * @param options - Scraper options for this request
   * @returns Scraping result
   */
  async scrape(url: string, options: Partial<ScraperOptions> = {}): Promise<ScrapingResult> {
    const mergedOptions = { ...this.options, ...options };
    
    // Check cache if enabled
    if (mergedOptions.cacheHtml) {
      const cached = this.htmlCache.get(url);
      if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
        logger.debug('Using cached HTML', { url });
        
        return {
          url,
          html: cached.html,
          status: 200,
          headers: {},
          cookies: [],
          title: '',
          links: [],
          duration: 0,
        };
      }
    }
    
    // Use retry logic
    return pRetry(
      () => this.scrapeWithoutRetry(url, mergedOptions),
      {
        retries: mergedOptions.retries || 3,
        onFailedAttempt: (error) => {
          logger.warn(`Scraping attempt ${error.attemptNumber} failed for ${url}`, {
            error: error.message,
            retriesLeft: error.retriesLeft,
          });
        },
      }
    );
  }
  
  /**
   * Scrape a URL without retry logic
   * @param url - URL to scrape
   * @param options - Scraper options
   * @returns Scraping result
   */
  private async scrapeWithoutRetry(url: string, options: ScraperOptions): Promise<ScrapingResult> {
    return performance.trackExecutionTime(
      'Scraping',
      'web-scraping',
      async () => {
        let page: Page | null = null;
        
        try {
          // Initialize browser if needed
          const browser = await this.initBrowser();
          
          // Create a new page
          page = await browser.newPage();
          
          // Set user agent
          const userAgent = options.userAgent || userAgentRotator.getRandomUserAgent();
          await page.setUserAgent(userAgent);
          
          // Set cookies if provided
          if (options.cookies && options.cookies.length > 0) {
            await page.setCookie(...options.cookies);
          }
          
          // Set request interception if needed
          if (options.interceptMedia || options.interceptFonts || options.interceptImages || options.interceptStyles) {
            await page.setRequestInterception(true);
            
            page.on('request', (request) => {
              const resourceType = request.resourceType();
              
              // Abort requests based on options
              if (
                (options.interceptMedia && resourceType === 'media') ||
                (options.interceptFonts && resourceType === 'font') ||
                (options.interceptImages && resourceType === 'image') ||
                (options.interceptStyles && resourceType === 'stylesheet')
              ) {
                request.abort();
              } else {
                request.continue();
              }
            });
          }
          
          // Navigate to URL
          const response = await page.goto(url, {
            waitUntil: options.waitUntil,
            timeout: options.timeout,
          });
          
          // Get status code
          const status = response ? response.status() : 0;
          
          // Get headers
          const headers = response ? response.headers() : {};
          
          // Get cookies
          const cookies = await page.cookies();
          
          // Get HTML content
          const html = await page.content();
          
          // Get page title
          const title = await page.title();
          
          // Extract links
          const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
              .map(a => a.href)
              .filter(href => href && href.startsWith('http'));
          });
          
          // Cache HTML if enabled
          if (options.cacheHtml) {
            this.htmlCache.set(url, {
              html,
              timestamp: Date.now(),
            });
          }
          
          // Mark proxy as successful if used
          if (options.proxy) {
            this.proxyManager.markProxySuccess(options.proxy);
          }
          
          // Create result
          const result: ScrapingResult = {
            url,
            html,
            status,
            headers,
            cookies,
            title,
            links,
            duration: 0, // Will be set by performance tracker
            userAgent,
            proxy: options.proxy,
          };
          
          return result;
        } catch (error) {
          // Mark proxy as failed if used
          if (options.proxy) {
            this.proxyManager.markProxyError(options.proxy);
          }
          
          logger.error('Error scraping URL', {
            url,
            error: error instanceof Error ? error.message : String(error),
          });
          
          // Create error result
          const errorResult: ScrapingResult = {
            url,
            html: '',
            status: 0,
            headers: {},
            cookies: [],
            title: '',
            links: [],
            duration: 0,
            error: error instanceof Error ? error.message : String(error),
          };
          
          throw error;
        } finally {
          // Close page
          if (page) {
            await page.close();
          }
        }
      },
      { reportToSentry: false, logLevel: 'debug' }
    );
  }
  
  /**
   * Scrape multiple URLs concurrently
   * @param urls - Array of URLs to scrape
   * @param options - Scraper options
   * @returns Array of scraping results
   */
  async scrapeMultiple(urls: string[], options: Partial<ScraperOptions> = {}): Promise<ScrapingResult[]> {
    const mergedOptions = { ...this.options, ...options };
    const concurrency = mergedOptions.maxConcurrency || 5;
    
    // Create batches of URLs
    const batches: string[][] = [];
    for (let i = 0; i < urls.length; i += concurrency) {
      batches.push(urls.slice(i, i + concurrency));
    }
    
    const results: ScrapingResult[] = [];
    
    // Process batches sequentially
    for (const batch of batches) {
      // Process URLs in each batch concurrently
      const batchResults = await Promise.all(
        batch.map(url => this.scrape(url, mergedOptions).catch(error => {
          logger.error('Error in batch scraping', {
            url,
            error: error instanceof Error ? error.message : String(error),
          });
          
          return {
            url,
            html: '',
            status: 0,
            headers: {},
            cookies: [],
            title: '',
            links: [],
            duration: 0,
            error: error instanceof Error ? error.message : String(error),
          } as ScrapingResult;
        }))
      );
      
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * Extract data from HTML using cheerio
   * @param html - HTML content
   * @param selector - CSS selector
   * @param attribute - Optional attribute to extract
   * @returns Extracted data
   */
  extractData(html: string, selector: string, attribute?: string): string[] {
    const $ = cheerio.load(html);
    const elements = $(selector);
    
    return elements.map((_: number, el: any) => {
      if (attribute) {
        return $(el).attr(attribute) || '';
      }
      return $(el).text().trim();
    }).get().filter(Boolean);
  }
  
  /**
   * Clear the HTML cache
   */
  clearCache(): void {
    this.htmlCache.clear();
    logger.debug('HTML cache cleared');
  }
  
  /**
   * Set the cache TTL
   * @param ttl - Time to live in milliseconds
   */
  setCacheTtl(ttl: number): void {
    this.cacheTtl = ttl;
    logger.debug('Cache TTL updated', { ttl });
  }
}

export default EnhancedScraper; 