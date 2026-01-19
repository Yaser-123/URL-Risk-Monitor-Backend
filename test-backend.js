const BASE_URL = 'http://localhost:3000';

const domainsToAdd = [
'chatgpt.com',        // OpenAI / ChatGPT
  'openai.com',         // OpenAI API & Site
  'gemini.google.com',  // Google Gemini
  'anthropic.com',      // Claude AI
  'claude.ai',          // Claude Chat interface
  'perplexity.ai',      // AI Search
  'midjourney.com',     // AI Art
  'deepseek.com',       // Emerging AI

  // --- SOCIAL & ENTERTAINMENT (The Traffic Leaders) ---
  'youtube.com',        // #2 Most visited globally
  'instagram.com',      // Meta / Social
  'reddit.com',         // Discussion
  'wikipedia.org',      // Knowledge
  'tiktok.com',         // ByteDance / Video
  'whatsapp.com',       // Messaging
  't.me',               // Telegram links
  'telegram.org',       // Telegram site
  'twitch.tv',          // Live streaming
  'netflix.com',        // Video streaming
  'spotify.com',        // Music streaming
  'pinterest.com',      // Visual social
  'quora.com',          // Q&A
  'medium.com',         // Articles
  'tumblr.com',         // Microblogging

  // --- GLOBAL E-COMMERCE & SERVICES ---
  'amazon.com',         // Global Retail
  'ebay.com',           // Auctions
  'walmart.com',        // US Retail
  'temu.com',           // Global Retail
  'aliexpress.com',     // Alibaba / Global
  'target.com',         // US Retail
  'flipkart.com',       // India Retail
  'meesho.com',         // India Social Commerce
  'nykaa.com',          // India Beauty
  'booking.com',        // Travel
  'airbnb.com',         // Travel

  // --- SEARCH & PORTALS ---
  'bing.com',           // Microsoft Search
  'duckduckgo.com',     // Privacy Search
  'yahoo.com',          // Portal
  'yahoo.co.jp',        // Huge in Japan
  'baidu.com',          // China Search
  'yandex.ru',          // Russia Search
  'naver.com',          // Korea Search

  // --- NEWS & UTILITIES ---
  'nytimes.com',        // News
  'bbc.co.uk',          // News
  'cnn.com',            // News
  'weather.com',        // Weather updates
  'canva.com',          // Design tool
  'roblox.com',         // Gaming/Social
  'zoom.us',            // Video Calls
  'dropbox.com',        // Storage
  'office.com'          // Microsoft 365
];

/**
 * Run this to seed your trusted domains
 */
async function seedTrustedDomains() {
  console.log(`🚀 Starting seed for ${domainsToAdd.length} domains...`);
  
  for (const domainName of domainsToAdd) {
    try {
      const response = await fetch(`${BASE_URL}/api/trusted-domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domainName,
          trust_level: 'full',
          source: 'org',
        }),
      });
      
      const result = await response.json();
      console.log(`✅ Added: ${domainName}`);
    } catch (err) {
      console.error(`❌ Failed: ${domainName}`, err);
    }
  }
  console.log('✨ Seeding complete!');
}

seedTrustedDomains();