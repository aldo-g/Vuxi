/**
 * Validates if a URL is properly formatted
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Normalizes a URL for deduplication purposes
   * @param {string} url - URL to normalize
   * @param {boolean} removeQueryParams - Whether to remove query parameters
   * @returns {string} Normalized URL
   */
  function normalizeUrl(url, removeQueryParams = false) {
    try {
      const urlObj = new URL(url);
      
      // Remove fragment
      urlObj.hash = '';
      
      if (removeQueryParams) {
        // Remove all query parameters for deduplication
        urlObj.search = '';
      } else {
        // Keep query parameters but sort them
        const params = new URLSearchParams(urlObj.search);
        params.sort();
        urlObj.search = params.toString();
      }
      
      // Remove trailing slash from pathname (unless it's just '/')
      if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      
      return urlObj.toString();
    } catch {
      return url;
    }
  }
  
  /**
   * Creates a simplified URL for deduplication
   * @param {string} url - URL to simplify
   * @returns {string} Simplified URL without language/irrelevant query params
   */
  function createDeduplicationKey(url) {
    try {
      const urlObj = new URL(url);
      
      // Remove fragment
      urlObj.hash = '';
      
      // Remove common query parameters that don't change content
      const paramsToRemove = [
        'hsLang',           // Hubspot language
        'utm_source',       // UTM tracking
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'fbclid',          // Facebook tracking
        'gclid',           // Google tracking
        '_ga',             // Google Analytics
        '__cf_chl_captcha_tk__', // Cloudflare
        'replytocom',      // WordPress comments
        'lang',            // Language parameters
        'language',
        'locale'
      ];
      
      const params = new URLSearchParams(urlObj.search);
      paramsToRemove.forEach(param => params.delete(param));
      
      // Only keep params that actually change content (e.g., paginated results, search queries)
      const contentChangingParams = ['page', 'search', 'q', 'query', 'category', 'tag'];
      const newParams = new URLSearchParams();
      
      for (const [key, value] of params) {
        if (contentChangingParams.some(allowedParam => key.toLowerCase().includes(allowedParam))) {
          newParams.set(key, value);
        }
      }
      
      urlObj.search = newParams.toString();
      
      // Remove trailing slash
      if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      
      return urlObj.toString();
    } catch {
      return url;
    }
  }
  
  /**
   * Checks if two URLs are from the same domain
   * @param {string} url1 - First URL
   * @param {string} url2 - Second URL
   * @returns {boolean} True if same domain, false otherwise
   */
  function isSameDomain(url1, url2) {
    try {
      const domain1 = new URL(url1).hostname;
      const domain2 = new URL(url2).hostname;
      
      // Remove 'www.' for comparison
      const cleanDomain1 = domain1.replace(/^www\./, '');
      const cleanDomain2 = domain2.replace(/^www\./, '');
      
      return cleanDomain1 === cleanDomain2;
    } catch {
      return false;
    }
  }
  
  /**
   * Checks if a URL should be excluded based on patterns
   * @param {string} url - URL to check
   * @param {RegExp[]} excludePatterns - Array of regex patterns
   * @returns {boolean} True if URL should be excluded
   */
  function shouldExcludeUrl(url, excludePatterns = []) {
    // Common exclusions
    const defaultExclusions = [
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|tar|gz)$/i, // Files
      /\.(jpg|jpeg|png|gif|svg|ico)$/i,                          // Images
      /\.(mp3|mp4|avi|mov|wmv|flv|webm)$/i,                     // Media
      /^mailto:/i,                                              // Email links
      /^tel:/i,                                                 // Phone links
      /^javascript:/i,                                          // JavaScript protocols
      /\/#/,                                                    // Fragment-only links
      /\/wp-json\//i,                                           // WordPress API
      /\/feed\//i,                                              // RSS feeds
      /\?replytocom=/i,                                         // WordPress comment replies
    ];
    
    // Check against default exclusions
    for (const pattern of defaultExclusions) {
      if (pattern.test(url)) {
        return true;
      }
    }
    
    // Check against custom exclusions
    for (const pattern of excludePatterns) {
      if (pattern.test(url)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Extracts the domain from a URL
   * @param {string} url - URL to extract domain from
   * @returns {string|null} Domain name or null if invalid
   */
  function extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  }
  
  /**
   * Formats a duration in milliseconds to a human-readable string
   * @param {number} milliseconds - Duration in milliseconds
   * @returns {string} Formatted duration string
   */
  function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }
  
  /**
   * Deduplicates an array of URLs, preferring simpler versions
   * @param {string[]} urls - Array of URLs
   * @returns {string[]} Deduplicated array
   */
  function deduplicateUrls(urls) {
    const urlMap = new Map();
    
    // Group URLs by their deduplicated key
    for (const url of urls) {
      const key = createDeduplicationKey(url);
      
      if (!urlMap.has(key)) {
        urlMap.set(key, []);
      }
      urlMap.get(key).push(url);
    }
    
    // For each group, prefer the simplest URL (fewest query params)
    const result = [];
    for (const [key, similarUrls] of urlMap) {
      // Sort by number of query parameters (ascending)
      const sorted = similarUrls.sort((a, b) => {
        const paramsA = new URL(a).searchParams.size;
        const paramsB = new URL(b).searchParams.size;
        return paramsA - paramsB;
      });
      
      // Take the URL with fewest parameters
      result.push(sorted[0]);
    }
    
    return result;
  }
  
  module.exports = {
    isValidUrl,
    normalizeUrl,
    createDeduplicationKey,
    isSameDomain,
    shouldExcludeUrl,
    extractDomain,
    formatDuration,
    deduplicateUrls
  };