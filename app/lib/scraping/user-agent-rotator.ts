import { createLogger } from '../monitoring/logger';

const logger = createLogger('user-agent-rotator');

/**
 * User agent categories
 */
export enum UserAgentCategory {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  BOT = 'bot',
}

/**
 * User agent browser types
 */
export enum BrowserType {
  CHROME = 'chrome',
  FIREFOX = 'firefox',
  SAFARI = 'safari',
  EDGE = 'edge',
  OPERA = 'opera',
}

/**
 * User agent operating systems
 */
export enum OperatingSystem {
  WINDOWS = 'windows',
  MACOS = 'macos',
  LINUX = 'linux',
  ANDROID = 'android',
  IOS = 'ios',
}

/**
 * User agent interface
 */
export interface UserAgent {
  value: string;
  category: UserAgentCategory;
  browser?: BrowserType;
  os?: OperatingSystem;
  version?: string;
  mobile?: boolean;
}

/**
 * Collection of modern user agents
 */
const USER_AGENTS: UserAgent[] = [
  // Chrome on Windows
  {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    category: UserAgentCategory.DESKTOP,
    browser: BrowserType.CHROME,
    os: OperatingSystem.WINDOWS,
    version: '120.0.0.0',
    mobile: false,
  },
  {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    category: UserAgentCategory.DESKTOP,
    browser: BrowserType.CHROME,
    os: OperatingSystem.WINDOWS,
    version: '119.0.0.0',
    mobile: false,
  },
  
  // Chrome on macOS
  {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    category: UserAgentCategory.DESKTOP,
    browser: BrowserType.CHROME,
    os: OperatingSystem.MACOS,
    version: '120.0.0.0',
    mobile: false,
  },
  {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    category: UserAgentCategory.DESKTOP,
    browser: BrowserType.CHROME,
    os: OperatingSystem.MACOS,
    version: '119.0.0.0',
    mobile: false,
  },
  
  // Firefox on Windows
  {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    category: UserAgentCategory.DESKTOP,
    browser: BrowserType.FIREFOX,
    os: OperatingSystem.WINDOWS,
    version: '120.0',
    mobile: false,
  },
  {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',
    category: UserAgentCategory.DESKTOP,
    browser: BrowserType.FIREFOX,
    os: OperatingSystem.WINDOWS,
    version: '119.0',
    mobile: false,
  },
  
  // Firefox on macOS
  {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
    category: UserAgentCategory.DESKTOP,
    browser: BrowserType.FIREFOX,
    os: OperatingSystem.MACOS,
    version: '120.0',
    mobile: false,
  },
  {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:119.0) Gecko/20100101 Firefox/119.0',
    category: UserAgentCategory.DESKTOP,
    browser: BrowserType.FIREFOX,
    os: OperatingSystem.MACOS,
    version: '119.0',
    mobile: false,
  },
  
  // Safari on macOS
  {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    category: UserAgentCategory.DESKTOP,
    browser: BrowserType.SAFARI,
    os: OperatingSystem.MACOS,
    version: '17.0',
    mobile: false,
  },
  {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
    category: UserAgentCategory.DESKTOP,
    browser: BrowserType.SAFARI,
    os: OperatingSystem.MACOS,
    version: '16.6',
    mobile: false,
  },
  
  // Edge on Windows
  {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    category: UserAgentCategory.DESKTOP,
    browser: BrowserType.EDGE,
    os: OperatingSystem.WINDOWS,
    version: '120.0.0.0',
    mobile: false,
  },
  {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
    category: UserAgentCategory.DESKTOP,
    browser: BrowserType.EDGE,
    os: OperatingSystem.WINDOWS,
    version: '119.0.0.0',
    mobile: false,
  },
  
  // Chrome on Android
  {
    value: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
    category: UserAgentCategory.MOBILE,
    browser: BrowserType.CHROME,
    os: OperatingSystem.ANDROID,
    version: '120.0.6099.144',
    mobile: true,
  },
  {
    value: 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.163 Mobile Safari/537.36',
    category: UserAgentCategory.MOBILE,
    browser: BrowserType.CHROME,
    os: OperatingSystem.ANDROID,
    version: '119.0.6045.163',
    mobile: true,
  },
  
  // Safari on iOS
  {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    category: UserAgentCategory.MOBILE,
    browser: BrowserType.SAFARI,
    os: OperatingSystem.IOS,
    version: '17.0',
    mobile: true,
  },
  {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    category: UserAgentCategory.MOBILE,
    browser: BrowserType.SAFARI,
    os: OperatingSystem.IOS,
    version: '16.6',
    mobile: true,
  },
];

/**
 * User agent rotator class
 */
class UserAgentRotator {
  private userAgents: UserAgent[] = USER_AGENTS;
  private lastUsedIndex = -1;
  
  /**
   * Get a random user agent
   * @returns Random user agent string
   */
  getRandomUserAgent(): string {
    const randomIndex = Math.floor(Math.random() * this.userAgents.length);
    this.lastUsedIndex = randomIndex;
    
    logger.debug('Selected user agent', {
      browser: this.userAgents[randomIndex].browser,
      os: this.userAgents[randomIndex].os,
      version: this.userAgents[randomIndex].version,
    });
    
    return this.userAgents[randomIndex].value;
  }
  
  /**
   * Get a user agent by category
   * @param category - User agent category
   * @returns Random user agent string from the specified category
   */
  getUserAgentByCategory(category: UserAgentCategory): string {
    const filteredAgents = this.userAgents.filter(ua => ua.category === category);
    
    if (filteredAgents.length === 0) {
      logger.warn(`No user agents found for category: ${category}, using random agent`);
      return this.getRandomUserAgent();
    }
    
    const randomIndex = Math.floor(Math.random() * filteredAgents.length);
    const selectedAgent = filteredAgents[randomIndex];
    
    logger.debug('Selected user agent by category', {
      category,
      browser: selectedAgent.browser,
      os: selectedAgent.os,
    });
    
    return selectedAgent.value;
  }
  
  /**
   * Get a user agent by browser type
   * @param browser - Browser type
   * @returns Random user agent string for the specified browser
   */
  getUserAgentByBrowser(browser: BrowserType): string {
    const filteredAgents = this.userAgents.filter(ua => ua.browser === browser);
    
    if (filteredAgents.length === 0) {
      logger.warn(`No user agents found for browser: ${browser}, using random agent`);
      return this.getRandomUserAgent();
    }
    
    const randomIndex = Math.floor(Math.random() * filteredAgents.length);
    const selectedAgent = filteredAgents[randomIndex];
    
    logger.debug('Selected user agent by browser', {
      browser,
      os: selectedAgent.os,
      version: selectedAgent.version,
    });
    
    return selectedAgent.value;
  }
  
  /**
   * Get a user agent by operating system
   * @param os - Operating system
   * @returns Random user agent string for the specified OS
   */
  getUserAgentByOS(os: OperatingSystem): string {
    const filteredAgents = this.userAgents.filter(ua => ua.os === os);
    
    if (filteredAgents.length === 0) {
      logger.warn(`No user agents found for OS: ${os}, using random agent`);
      return this.getRandomUserAgent();
    }
    
    const randomIndex = Math.floor(Math.random() * filteredAgents.length);
    const selectedAgent = filteredAgents[randomIndex];
    
    logger.debug('Selected user agent by OS', {
      os,
      browser: selectedAgent.browser,
      version: selectedAgent.version,
    });
    
    return selectedAgent.value;
  }
  
  /**
   * Get a desktop user agent
   * @returns Random desktop user agent string
   */
  getDesktopUserAgent(): string {
    return this.getUserAgentByCategory(UserAgentCategory.DESKTOP);
  }
  
  /**
   * Get a mobile user agent
   * @returns Random mobile user agent string
   */
  getMobileUserAgent(): string {
    return this.getUserAgentByCategory(UserAgentCategory.MOBILE);
  }
  
  /**
   * Add a custom user agent
   * @param userAgent - User agent to add
   */
  addUserAgent(userAgent: UserAgent): void {
    this.userAgents.push(userAgent);
    logger.debug('Added custom user agent', {
      browser: userAgent.browser,
      os: userAgent.os,
      category: userAgent.category,
    });
  }
  
  /**
   * Get all available user agents
   * @returns Array of all user agents
   */
  getAllUserAgents(): UserAgent[] {
    return [...this.userAgents];
  }
  
  /**
   * Get the last used user agent
   * @returns Last used user agent or null if none used yet
   */
  getLastUsedUserAgent(): UserAgent | null {
    if (this.lastUsedIndex === -1) {
      return null;
    }
    
    return this.userAgents[this.lastUsedIndex];
  }
}

// Export singleton instance
const userAgentRotator = new UserAgentRotator();
export default userAgentRotator;
