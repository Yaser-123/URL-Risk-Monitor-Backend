/**
 * Extension Integration Guide
 * How to integrate the optimized backend with your Chrome extension
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

// Replace with your deployed backend URL
const API_BASE_URL = 'https://your-backend.railway.app'; // TODO: Update after deployment

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize domain for consistent backend communication
 * Matches backend's normalizeDomain() function
 */
function normalizeDomainForAPI(urlOrDomain) {
  let domain = urlOrDomain.trim().toLowerCase();
  
  // Remove protocol
  domain = domain.replace(/^[a-z]+:\/\//, '');
  
  // Remove www.
  domain = domain.replace(/^www\./, '');
  
  // Extract hostname only
  domain = domain.split('/')[0].split('?')[0].split('#')[0];
  
  // Remove port
  domain = domain.split(':')[0];
  
  return domain;
}

/**
 * Check if domain is in trusted list (cached)
 * Call this once on extension load, then cache the result
 */
async function fetchTrustedDomains() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trusted-domains`);
    const data = await response.json();
    
    if (data.success) {
      // Store in chrome.storage.local for offline access
      chrome.storage.local.set({ trustedDomains: data.domains });
      return data.domains;
    }
  } catch (error) {
    console.warn('Failed to fetch trusted domains (using cached):', error);
    // Return cached version
    const cached = await chrome.storage.local.get('trustedDomains');
    return cached.trustedDomains || [];
  }
}

/**
 * Check if current domain is trusted (fast local check)
 */
async function isDomainTrusted(domain) {
  const normalizedDomain = normalizeDomainForAPI(domain);
  const cached = await chrome.storage.local.get('trustedDomains');
  const trustedList = cached.trustedDomains || [];
  
  return trustedList.includes(normalizedDomain);
}

/**
 * Log risk statistics to backend (fire-and-forget)
 * Only logs if domain is untrusted
 */
async function logRiskStat(domain, riskLevel) {
  try {
    const normalizedDomain = normalizeDomainForAPI(domain);
    
    // Optional: Check if trusted locally before making request
    // (Backend will also check, this is just optimization)
    const isTrusted = await isDomainTrusted(normalizedDomain);
    if (isTrusted) {
      console.log('Domain is trusted, skipping backend log:', normalizedDomain);
      return { logged: false, reason: 'trusted_domain_cached' };
    }
    
    // Send to backend
    const response = await fetch(`${API_BASE_URL}/api/stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: normalizedDomain,
        riskLevel: riskLevel, // 'low', 'medium', or 'high'
      }),
    });
    
    const result = await response.json();
    console.log('Backend response:', result);
    return result;
    
  } catch (error) {
    // Graceful degradation - extension works even if backend is down
    console.warn('Stats logging failed (non-critical):', error);
    return { logged: false, reason: 'error' };
  }
}

// ============================================================================
// INTEGRATION EXAMPLE (content.js)
// ============================================================================

/**
 * Example: Integrate with existing risk detection
 */
async function onPageLoad() {
  const currentDomain = window.location.hostname;
  const normalizedDomain = normalizeDomainForAPI(currentDomain);
  
  // Step 1: Calculate risk level (your existing logic)
  const riskLevel = getDomainRiskLevel(currentDomain);
  
  // Step 2: If risky, show warning
  if (riskLevel === 'medium' || riskLevel === 'high') {
    showWarningBanner(riskLevel);
  }
  
  // Step 3: Log to backend (async, non-blocking)
  // Only logs untrusted domains, backend handles deduplication
  logRiskStat(normalizedDomain, riskLevel).then(result => {
    if (result.logged) {
      console.log('✅ Risk stat logged to backend');
    } else {
      console.log('ℹ️ Not logged:', result.reason);
    }
  });
}

/**
 * Initialize: Fetch trusted domains on extension install/update
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Fetching trusted domains from backend...');
  const domains = await fetchTrustedDomains();
  console.log(`Cached ${domains.length} trusted domains`);
});

/**
 * Refresh trusted domains periodically (every 24 hours)
 */
chrome.alarms.create('refreshTrustedDomains', { periodInMinutes: 1440 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'refreshTrustedDomains') {
    await fetchTrustedDomains();
  }
});

// ============================================================================
// TESTING
// ============================================================================

/**
 * Test backend integration in DevTools console
 */
async function testBackendIntegration() {
  console.log('🧪 Testing Backend Integration...\n');
  
  // Test 1: Fetch trusted domains
  console.log('Test 1: Fetching trusted domains...');
  const domains = await fetchTrustedDomains();
  console.log('✅ Trusted domains:', domains.slice(0, 5), `(${domains.length} total)\n`);
  
  // Test 2: Check if google.com is trusted
  console.log('Test 2: Checking if google.com is trusted...');
  const isGoogleTrusted = await isDomainTrusted('google.com');
  console.log('✅ google.com trusted:', isGoogleTrusted, '\n');
  
  // Test 3: Log a trusted domain (should skip)
  console.log('Test 3: Logging trusted domain (should skip)...');
  const result1 = await logRiskStat('google.com', 'high');
  console.log('✅ Result:', result1, '\n');
  
  // Test 4: Log an untrusted domain
  console.log('Test 4: Logging untrusted domain...');
  const result2 = await logRiskStat('test-phishing-site.com', 'high');
  console.log('✅ Result:', result2, '\n');
  
  // Test 5: Log same domain again (should rate limit)
  console.log('Test 5: Logging same domain again (should rate limit)...');
  const result3 = await logRiskStat('test-phishing-site.com', 'high');
  console.log('✅ Result:', result3, '\n');
  
  console.log('🎉 All tests complete!');
}

// Run in DevTools: testBackendIntegration()

// ============================================================================
// DEPLOYMENT CHECKLIST
// ============================================================================

/*
  ✅ BEFORE DEPLOYMENT:
  
  1. Update API_BASE_URL with your Railway/Render URL
  
  2. Test locally:
     - npm run dev (start backend)
     - Load extension in Chrome
     - Run testBackendIntegration() in console
  
  3. Verify backend is working:
     - curl https://your-backend.com/api/trusted-domains
     - Should return list of domains
  
  4. Seed trusted domains in Neon:
     - Run seed-data.sql in Neon SQL Editor
     - Verify: SELECT COUNT(*) FROM trusted_domains;
  
  5. Deploy backend to production:
     - Set DATABASE_URL environment variable
     - Deploy and get production URL
  
  6. Update extension:
     - Replace API_BASE_URL in this file
     - Copy functions to content.js
     - Call logRiskStat() after risk detection
  
  7. Test end-to-end:
     - Visit trusted site (google.com) → No backend log
     - Visit untrusted site → Backend logs it
     - Revisit same site → Rate limited
  
  ✅ PRIVACY COMPLIANCE:
  
  - Backend logs NO IP addresses
  - Backend logs NO user identifiers
  - Only domain + risk level + timestamps
  - User can opt-out by disabling stats in extension settings (TODO: add toggle)
  
  ✅ PERFORMANCE:
  
  - All API calls are async (non-blocking)
  - Extension works 100% offline if backend is down
  - Trusted domains cached locally
  - Rate limiting prevents excessive requests
*/
