import { Router, Request, Response } from 'express';
import { db } from '../db';
import { trustedDomains } from '../schema';
import { eq } from 'drizzle-orm';
import { normalizeDomain } from '../utils/normalizeDomain';

const router = Router();

// In-memory fallback for trusted domains
const defaultTrustedDomains = [
  'google.com', 'github.com', 'microsoft.com', 'apple.com',
  'amazon.com', 'facebook.com', 'twitter.com', 'linkedin.com',
  'youtube.com', 'stackoverflow.com', 'reddit.com', 'wikipedia.org',
  'netflix.com', 'instagram.com', 'dropbox.com', 'adobe.com'
];
let dbAvailable = true;

/**
 * GET /api/trusted-domains
 * Fetch all trusted domains
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    let domainList: string[] = [];
    
    // Check if database is available
    if (db && dbAvailable) {
      try {
        const domains = await db.select().from(trustedDomains);
        domainList = domains.map(d => d.domain);
      } catch (err) {
        console.warn('DB read failed, using default trusted domains');
        dbAvailable = false;
        domainList = defaultTrustedDomains;
      }
    } else {
      domainList = defaultTrustedDomains;
    }
    
    res.json({
      success: true,
      count: domainList.length,
      domains: domainList,
      dataSource: dbAvailable ? 'database' : 'default'
    });
  } catch (error) {
    console.error('Error fetching trusted domains:', error);
    res.json({
      success: true,
      count: defaultTrustedDomains.length,
      domains: defaultTrustedDomains,
      dataSource: 'default'
    });
  }
});

/**
 * GET /api/trusted-domains/:domain
 * Check if a specific domain is trusted
 */
router.get('/:domain', async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    
    // Validate domain parameter
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid domain parameter',
      });
    }
    
    // Normalize domain (lowercase, no protocol, no www)
    const normalizedDomain = normalizeDomain(domain);
    
    let isTrusted = false;
    let trustInfo: any = null;
    
    // Check if database is available
    if (db && dbAvailable) {
      try {
        // Query database
        const result = await db
          .select()
          .from(trustedDomains)
          .where(eq(trustedDomains.domain, normalizedDomain))
          .limit(1);
        
        if (result.length > 0) {
          isTrusted = true;
          trustInfo = result[0];
        }
      } catch (err) {
        console.warn('DB check failed, using default trusted list');
        dbAvailable = false;
        isTrusted = defaultTrustedDomains.includes(normalizedDomain);
      }
    } else {
      // Check against default list
      isTrusted = defaultTrustedDomains.includes(normalizedDomain);
    }
    
    if (isTrusted) {
      res.json({
        success: true,
        trusted: true,
        domain: trustInfo?.domain || normalizedDomain,
        trustLevel: trustInfo?.trustLevel || 'full',
        source: trustInfo?.source || 'default',
        dataSource: dbAvailable ? 'database' : 'default'
      });
    } else {
      res.json({
        success: true,
        trusted: false,
        domain: normalizedDomain,
      });
    }
  } catch (error) {
    console.error('Error checking domain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check domain',
    });
  }
});

/**
 * POST /api/trusted-domains
 * Add a new trusted domain
 * 
 * ⚠️ TODO: Add authentication before production deployment
 * This endpoint should be protected with admin auth tokens
 * For hackathon/demo: Open for easy testing
 * 
 * Body: { "domain": "google.com", "trust_level": "full", "source": "manual" }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Check if database is available
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'Database not available - cannot add trusted domains',
      });
    }
    
    const { domain, trust_level = 'full', source = 'manual' } = req.body;
    
    // Validate input
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Domain is required',
      });
    }
    
    // Normalize domain (removes protocol, www, lowercase)
    const normalizedDomain = normalizeDomain(domain);
    
    // Validate trust level
    const validTrustLevels = ['full', 'login-safe', 'info-only'];
    if (!validTrustLevels.includes(trust_level)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trust level (must be: full, login-safe, or info-only)',
      });
    }
    
    // Insert domain (will fail if duplicate due to UNIQUE constraint)
    const newDomain = await db
      .insert(trustedDomains)
      .values({
        domain: normalizedDomain,
        trustLevel: trust_level,
        source,
      })
      .returning();
    
    res.status(201).json({
      success: true,
      domain: newDomain[0],
      message: 'Trusted domain added successfully',
    });
  } catch (error: any) {
    // Handle duplicate domain error (PostgreSQL unique constraint violation)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Domain already exists in trusted list',
      });
    }
    
    console.error('Error adding trusted domain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add trusted domain',
    });
  }
});

export default router;
