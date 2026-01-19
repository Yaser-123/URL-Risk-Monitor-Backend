// ============================================
// EXTENSION API INTEGRATION
// ============================================
// Add this to your content.js to integrate with backend

// Backend API URL (update after deployment)
const API_BASE_URL = 'http://localhost:3000'; // Change to your deployed URL

// Cache for trusted domains (refresh every hour)
let trustedDomainsCache = [];
let lastFetch = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Fetch trusted domains from backend API
 * @returns {Promise<string[]>} Array of trusted domain names
 */
async function fetchTrustedDomainsFromAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trusted-domains`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && Array.isArray(data.domains)) {
      return data.domains;
    }
    
    return [];
  } catch (error) {
    console.error('[EXT] Failed to fetch trusted domains from API:', error);
    return [];
  }
}

/**
 * Get trusted domains (with caching)
 * @returns {Promise<string[]>} Cached or fresh trusted domains
 */
async function getTrustedDomains() {
  const now = Date.now();
  
  // Return cached data if still fresh
  if (trustedDomainsCache.length > 0 && (now - lastFetch) < CACHE_DURATION) {
    console.log('[EXT] Using cached trusted domains');
    return trustedDomainsCache;
  }
  
  // Fetch fresh data
  console.log('[EXT] Fetching fresh trusted domains from API');
  const domains = await fetchTrustedDomainsFromAPI();
  
  if (domains.length > 0) {
    trustedDomainsCache = domains;
    lastFetch = now;
  }
  
  return trustedDomainsCache;
}

/**
 * Check if specific domain is trusted (backend query)
 * @param {string} domain - Domain to check
 * @returns {Promise<boolean>} True if trusted
 */
async function isDomainTrusted(domain) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trusted-domains/${domain}`);
    const data = await response.json();
    
    return data.success && data.trusted;
  } catch (error) {
    console.error('[EXT] Error checking domain trust:', error);
    return false;
  }
}

/**
 * Log anonymous risk statistics (optional)
 * @param {string} domain - Domain name
 * @param {string} riskLevel - 'low', 'medium', or 'high'
 */
async function logRiskStat(domain, riskLevel) {
  try {
    // Fire and forget - don't wait for response
    fetch(`${API_BASE_URL}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, riskLevel }),
    }).catch(() => {}); // Ignore errors
  } catch (error) {
    // Silently fail - stats logging is optional
  }
}

/**
 * Enhanced getDomainAgeScore with backend integration
 * Now checks backend first, falls back to heuristics
 */
async function getDomainAgeScoreEnhanced(hostname) {
  // Check if domain is in backend's trusted list
  const trustedDomains = await getTrustedDomains();
  const rootDomain = hostname.split('.').slice(-2).join('.');
  
  if (trustedDomains.includes(rootDomain)) {
    return { score: 0, reason: 'Backend-verified trusted domain' };
  }
  
  // Fallback to heuristic scoring
  return getDomainAgeScore(hostname);
}

/**
 * Initialize backend integration on extension load
 */
async function initBackendIntegration() {
  try {
    // Pre-fetch trusted domains on startup
    const domains = await getTrustedDomains();
    console.log(`[EXT] Loaded ${domains.length} trusted domains from backend`);
    
    // Optionally log this page visit (anonymous)
    if (riskLevel !== 'low') {
      logRiskStat(currentURL, riskLevel);
    }
  } catch (error) {
    console.error('[EXT] Backend integration initialization failed:', error);
  }
}

// Export for use in main extension code
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getTrustedDomains,
    isDomainTrusted,
    logRiskStat,
    getDomainAgeScoreEnhanced,
    initBackendIntegration,
  };
}
