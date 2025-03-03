import EnhancedScraper from './enhanced-scraper';
import ProxyManager, { ProxyProtocol } from './proxy-manager';
import userAgentRotator, { UserAgentCategory } from './user-agent-rotator';
import { createLogger } from '../monitoring/logger';

const logger = createLogger('scraping-example');

/**
 * Example of using the enhanced scraper
 */
async function scrapingExample(): Promise<void> {
  try {
    // Initialize proxy manager with some example proxies
    const proxyManager = new ProxyManager([
      {
        host: '127.0.0.1',
        port: 8080,
        protocol: ProxyProtocol.HTTP,
        successCount: 0,
        errorCount: 0,
      },
      // Add more proxies as needed
    ]);
    
    // Initialize the scraper with custom options
    const scraper = new EnhancedScraper({
      headless: true,
      timeout: 30000,
      retries: 3,
      maxConcurrency: 2,
      cacheHtml: true,
      interceptImages: true,
      interceptMedia: true,
      interceptFonts: true,
    }, proxyManager);
    
    logger.info('Starting scraping example');
    
    // Example 1: Scrape a single URL
    const result = await scraper.scrape('https://example.com', {
      userAgent: userAgentRotator.getDesktopUserAgent(),
    });
    
    logger.info('Scraped single URL', {
      url: result.url,
      title: result.title,
      statusCode: result.status,
      htmlLength: result.html.length,
      linkCount: result.links.length,
    });
    
    // Example 2: Extract data using cheerio
    const paragraphs = scraper.extractData(result.html, 'p');
    logger.info('Extracted paragraphs', {
      count: paragraphs.length,
      first: paragraphs[0]?.substring(0, 100),
    });
    
    // Example 3: Scrape multiple URLs concurrently
    const urls = [
      'https://example.com',
      'https://example.org',
      'https://example.net',
    ];
    
    const results = await scraper.scrapeMultiple(urls, {
      userAgent: userAgentRotator.getRandomUserAgent(),
      timeout: 20000,
    });
    
    logger.info('Scraped multiple URLs', {
      count: results.length,
      successful: results.filter(r => r.status === 200).length,
      failed: results.filter(r => r.status !== 200).length,
    });
    
    // Example 4: Extract specific data from all results
    for (const result of results) {
      const title = scraper.extractData(result.html, 'title')[0] || 'No title';
      const headings = scraper.extractData(result.html, 'h1, h2');
      const links = scraper.extractData(result.html, 'a', 'href');
      
      logger.info('Extracted data from URL', {
        url: result.url,
        title,
        headingCount: headings.length,
        linkCount: links.length,
      });
    }
    
    // Close the browser when done
    await scraper.closeBrowser();
    
    logger.info('Scraping example completed successfully');
  } catch (error) {
    logger.error('Error in scraping example', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  scrapingExample().catch(error => {
    console.error('Unhandled error in scraping example:', error);
    process.exit(1);
  });
}

export default scrapingExample; 