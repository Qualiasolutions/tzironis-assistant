import { createLogger } from '../monitoring/logger';

const logger = createLogger('proxy-manager');

/**
 * Proxy authentication type
 */
export enum ProxyAuthType {
  NONE = 'none',
  BASIC = 'basic',
  DIGEST = 'digest',
}

/**
 * Proxy protocol type
 */
export enum ProxyProtocol {
  HTTP = 'http',
  HTTPS = 'https',
  SOCKS4 = 'socks4',
  SOCKS5 = 'socks5',
}

/**
 * Proxy interface
 */
export interface Proxy {
  host: string;
  port: number;
  protocol: ProxyProtocol;
  username?: string;
  password?: string;
  authType?: ProxyAuthType;
  country?: string;
  city?: string;
  successCount: number;
  errorCount: number;
  lastUsed?: number;
  lastTested?: number;
  isWorking?: boolean;
  responseTime?: number;
  tags?: string[];
}

/**
 * Proxy manager class for handling proxy rotation and health tracking
 */
export default class ProxyManager {
  private proxies: Proxy[] = [];
  private currentProxyIndex = -1;
  private lastRotationTime = 0;
  private rotationInterval = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Create a new ProxyManager
   * @param proxies - Initial list of proxies
   * @param rotationInterval - Interval for proxy rotation in milliseconds
   */
  constructor(proxies: Proxy[] = [], rotationInterval?: number) {
    this.proxies = proxies;
    
    if (rotationInterval) {
      this.rotationInterval = rotationInterval;
    }
    
    logger.info('ProxyManager initialized', {
      proxyCount: this.proxies.length,
      rotationInterval: this.rotationInterval,
    });
  }
  
  /**
   * Add a proxy to the manager
   * @param proxy - Proxy to add
   */
  addProxy(proxy: Proxy): void {
    // Initialize success and error counts if not present
    if (proxy.successCount === undefined) {
      proxy.successCount = 0;
    }
    
    if (proxy.errorCount === undefined) {
      proxy.errorCount = 0;
    }
    
    this.proxies.push(proxy);
    
    logger.debug('Added proxy', {
      proxy: `${proxy.host}:${proxy.port}`,
      protocol: proxy.protocol,
      country: proxy.country,
    });
  }
  
  /**
   * Add multiple proxies to the manager
   * @param proxies - Array of proxies to add
   */
  addProxies(proxies: Proxy[]): void {
    proxies.forEach(proxy => this.addProxy(proxy));
    logger.info(`Added ${proxies.length} proxies`);
  }
  
  /**
   * Remove a proxy from the manager
   * @param proxy - Proxy to remove
   * @returns True if proxy was removed, false otherwise
   */
  removeProxy(proxy: Proxy): boolean {
    const initialLength = this.proxies.length;
    
    this.proxies = this.proxies.filter(
      p => !(p.host === proxy.host && p.port === proxy.port)
    );
    
    const removed = initialLength > this.proxies.length;
    
    if (removed) {
      logger.debug('Removed proxy', {
        proxy: `${proxy.host}:${proxy.port}`,
      });
    }
    
    return removed;
  }
  
  /**
   * Get the next proxy in the rotation
   * @returns Next proxy or undefined if no proxies available
   */
  getNextProxy(): Proxy | undefined {
    if (this.proxies.length === 0) {
      logger.warn('No proxies available');
      return undefined;
    }
    
    // Check if we should rotate based on time
    const now = Date.now();
    const shouldRotateTime = now - this.lastRotationTime >= this.rotationInterval;
    
    if (shouldRotateTime || this.currentProxyIndex === -1) {
      this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
      this.lastRotationTime = now;
    }
    
    const proxy = this.proxies[this.currentProxyIndex];
    proxy.lastUsed = now;
    
    logger.debug('Using proxy', {
      proxy: `${proxy.host}:${proxy.port}`,
      protocol: proxy.protocol,
      successRate: this.getProxySuccessRate(proxy),
    });
    
    return proxy;
  }
  
  /**
   * Get a random proxy from the pool
   * @returns Random proxy or undefined if no proxies available
   */
  getRandomProxy(): Proxy | undefined {
    if (this.proxies.length === 0) {
      logger.warn('No proxies available');
      return undefined;
    }
    
    const randomIndex = Math.floor(Math.random() * this.proxies.length);
    const proxy = this.proxies[randomIndex];
    proxy.lastUsed = Date.now();
    
    logger.debug('Using random proxy', {
      proxy: `${proxy.host}:${proxy.port}`,
      protocol: proxy.protocol,
    });
    
    return proxy;
  }
  
  /**
   * Get the best performing proxy based on success rate
   * @param minSuccessRate - Minimum success rate required (0-1)
   * @returns Best proxy or undefined if no proxies meet criteria
   */
  getBestProxy(minSuccessRate = 0.7): Proxy | undefined {
    if (this.proxies.length === 0) {
      logger.warn('No proxies available');
      return undefined;
    }
    
    // Filter proxies with minimum success rate and at least 5 attempts
    const eligibleProxies = this.proxies.filter(proxy => {
      const totalAttempts = proxy.successCount + proxy.errorCount;
      if (totalAttempts < 5) return false;
      
      const successRate = proxy.successCount / totalAttempts;
      return successRate >= minSuccessRate;
    });
    
    if (eligibleProxies.length === 0) {
      logger.warn('No proxies meet minimum success rate criteria');
      return this.getRandomProxy();
    }
    
    // Sort by success rate
    eligibleProxies.sort((a, b) => {
      const aRate = a.successCount / (a.successCount + a.errorCount);
      const bRate = b.successCount / (b.successCount + b.errorCount);
      return bRate - aRate;
    });
    
    const proxy = eligibleProxies[0];
    proxy.lastUsed = Date.now();
    
    logger.debug('Using best proxy', {
      proxy: `${proxy.host}:${proxy.port}`,
      successRate: this.getProxySuccessRate(proxy),
    });
    
    return proxy;
  }
  
  /**
   * Mark a proxy as successful
   * @param proxy - Proxy to mark
   */
  markProxySuccess(proxy: Proxy): void {
    const foundProxy = this.findProxy(proxy);
    
    if (foundProxy) {
      foundProxy.successCount++;
      foundProxy.isWorking = true;
      
      logger.debug('Marked proxy as successful', {
        proxy: `${proxy.host}:${proxy.port}`,
        successCount: foundProxy.successCount,
        successRate: this.getProxySuccessRate(foundProxy),
      });
    }
  }
  
  /**
   * Mark a proxy as failed
   * @param proxy - Proxy to mark
   */
  markProxyError(proxy: Proxy): void {
    const foundProxy = this.findProxy(proxy);
    
    if (foundProxy) {
      foundProxy.errorCount++;
      
      // Mark as not working if error rate is too high
      const totalAttempts = foundProxy.successCount + foundProxy.errorCount;
      const errorRate = foundProxy.errorCount / totalAttempts;
      
      if (totalAttempts >= 5 && errorRate > 0.7) {
        foundProxy.isWorking = false;
      }
      
      logger.debug('Marked proxy as failed', {
        proxy: `${proxy.host}:${proxy.port}`,
        errorCount: foundProxy.errorCount,
        errorRate: errorRate.toFixed(2),
        isWorking: foundProxy.isWorking,
      });
    }
  }
  
  /**
   * Get all proxies
   * @returns Array of all proxies
   */
  getAllProxies(): Proxy[] {
    return [...this.proxies];
  }
  
  /**
   * Get working proxies
   * @returns Array of working proxies
   */
  getWorkingProxies(): Proxy[] {
    return this.proxies.filter(proxy => 
      proxy.isWorking === undefined || proxy.isWorking === true
    );
  }
  
  /**
   * Get proxies by country
   * @param country - Country code
   * @returns Array of proxies from the specified country
   */
  getProxiesByCountry(country: string): Proxy[] {
    return this.proxies.filter(
      proxy => proxy.country && proxy.country.toLowerCase() === country.toLowerCase()
    );
  }
  
  /**
   * Get proxies by tag
   * @param tag - Tag to filter by
   * @returns Array of proxies with the specified tag
   */
  getProxiesByTag(tag: string): Proxy[] {
    return this.proxies.filter(
      proxy => proxy.tags && proxy.tags.includes(tag)
    );
  }
  
  /**
   * Set the rotation interval
   * @param interval - Interval in milliseconds
   */
  setRotationInterval(interval: number): void {
    this.rotationInterval = interval;
    logger.debug('Updated rotation interval', { interval });
  }
  
  /**
   * Get proxy success rate
   * @param proxy - Proxy to check
   * @returns Success rate (0-1)
   */
  getProxySuccessRate(proxy: Proxy): number {
    const totalAttempts = proxy.successCount + proxy.errorCount;
    if (totalAttempts === 0) return 0;
    
    return proxy.successCount / totalAttempts;
  }
  
  /**
   * Find a proxy in the list
   * @param proxy - Proxy to find
   * @returns Found proxy or undefined
   */
  private findProxy(proxy: Proxy): Proxy | undefined {
    return this.proxies.find(
      p => p.host === proxy.host && p.port === proxy.port
    );
  }
  
  /**
   * Get proxy string for puppeteer
   * @param proxy - Proxy to convert
   * @returns Proxy string
   */
  getProxyString(proxy: Proxy): string {
    let proxyString = '';
    
    switch (proxy.protocol) {
      case ProxyProtocol.HTTP:
        proxyString = 'http://';
        break;
      case ProxyProtocol.HTTPS:
        proxyString = 'https://';
        break;
      case ProxyProtocol.SOCKS4:
        proxyString = 'socks4://';
        break;
      case ProxyProtocol.SOCKS5:
        proxyString = 'socks5://';
        break;
      default:
        proxyString = 'http://';
    }
    
    // Add authentication if provided
    if (proxy.username && proxy.password) {
      proxyString += `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@`;
    }
    
    // Add host and port
    proxyString += `${proxy.host}:${proxy.port}`;
    
    return proxyString;
  }
  
  /**
   * Load proxies from a file
   * @param filePath - Path to proxy file
   */
  async loadProxiesFromFile(filePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(filePath, 'utf-8');
      const lines = data.split('\n').filter(line => line.trim() !== '');
      
      const newProxies: Proxy[] = [];
      
      for (const line of lines) {
        try {
          // Parse proxy line (format: host:port:username:password:protocol:country)
          const parts = line.split(':');
          
          if (parts.length < 2) continue;
          
          const host = parts[0].trim();
          const port = parseInt(parts[1].trim(), 10);
          
          if (!host || isNaN(port)) continue;
          
          const proxy: Proxy = {
            host,
            port,
            protocol: ProxyProtocol.HTTP,
            successCount: 0,
            errorCount: 0,
          };
          
          // Add optional parts if available
          if (parts.length >= 4) {
            proxy.username = parts[2].trim();
            proxy.password = parts[3].trim();
            proxy.authType = ProxyAuthType.BASIC;
          }
          
          if (parts.length >= 5) {
            const protocol = parts[4].trim().toLowerCase();
            
            switch (protocol) {
              case 'http':
                proxy.protocol = ProxyProtocol.HTTP;
                break;
              case 'https':
                proxy.protocol = ProxyProtocol.HTTPS;
                break;
              case 'socks4':
                proxy.protocol = ProxyProtocol.SOCKS4;
                break;
              case 'socks5':
                proxy.protocol = ProxyProtocol.SOCKS5;
                break;
            }
          }
          
          if (parts.length >= 6) {
            proxy.country = parts[5].trim();
          }
          
          newProxies.push(proxy);
        } catch (error) {
          logger.warn('Failed to parse proxy line', {
            line,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      
      this.addProxies(newProxies);
      
      logger.info(`Loaded ${newProxies.length} proxies from file`, {
        filePath,
      });
    } catch (error) {
      logger.error('Failed to load proxies from file', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
