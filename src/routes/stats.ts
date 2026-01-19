import { Router, Request, Response } from 'express';
import { db } from '../db';
import { riskStats, trustedDomains } from '../schema';
import { eq, sql } from 'drizzle-orm';
import { normalizeDomain } from '../utils/normalizeDomain';

const router = Router();

/**
 * IN-MEMORY RATE LIMITING (Hackathon-safe, no Redis needed)
 * 
 * Purpose: Prevent same domain from spamming DB updates
 * Strategy: Track last log timestamp per domain in memory
 * Cooldown: 60 seconds (configurable)
 * 
 * ⚠️ TODO for production: Replace with Redis for multi-instance support
 * For single-instance hackathon deployment: This is perfect
 */
const DOMAIN_COOLDOWN_MS = 60 * 1000; // 1 minute
const lastLoggedMap = new Map<string, number>(); // domain -> timestamp

// In-memory fallback when DB is unavailable
const inMemoryStats = new Map<string, { domain: string; riskLevel: string; hitCount: number; firstSeen: Date; lastSeen: Date }>();
let dbAvailable = true;

/**
 * Check if domain is within cooldown period
 */
function isRateLimited(domain: string): boolean {
  const lastLogged = lastLoggedMap.get(domain);
  if (!lastLogged) return false;
  
  const timeSinceLastLog = Date.now() - lastLogged;
  return timeSinceLastLog < DOMAIN_COOLDOWN_MS;
}

/**
 * Mark domain as logged (update cooldown tracker)
 */
function markAsLogged(domain: string): void {
  lastLoggedMap.set(domain, Date.now());
}

/**
 * POST /api/stats
 * Log anonymous risk statistics (OPTIMIZED)
 * 
 * NEW BEHAVIOR:
 * 1. Normalize domain
 * 2. Check if trusted → skip logging
 * 3. Check rate limit → skip if too frequent
 * 4. Upsert: INSERT new or UPDATE existing (increment hit_count)
 * 
 * Storage optimization: Same domain = 1 row, not 1000 rows
 * Privacy: NO IP logging, NO user identifiers
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { domain, riskLevel } = req.body;
    
    // Validate input
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Domain is required',
      });
    }
    
    // Validate risk level
    const validRiskLevels = ['low', 'medium', 'high'];
    if (!riskLevel || !validRiskLevels.includes(riskLevel)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid risk level (must be: low, medium, or high)',
      });
    }
    
    // Normalize domain (remove protocol, www, lowercase)
    const normalizedDomain = normalizeDomain(domain);
    
    // ✅ STEP 1: Check if domain is trusted (if DB available)
    if (db && dbAvailable) {
      try {
        const trustedCheck = await db
          .select()
          .from(trustedDomains)
          .where(eq(trustedDomains.domain, normalizedDomain))
          .limit(1);
        
        if (trustedCheck.length > 0) {
          // Domain is trusted → DO NOT LOG
          return res.status(200).json({
            logged: false,
            reason: 'trusted_domain',
            message: 'Domain is in trusted list, not logging stats',
          });
        }
      } catch (err) {
        console.warn('DB check failed, continuing without trusted check');
        dbAvailable = false;
      }
    }
    
    // ✅ STEP 2: Check rate limiting (in-memory cooldown)
    if (isRateLimited(normalizedDomain)) {
      return res.status(200).json({
        logged: false,
        reason: 'rate_limited',
        message: 'Domain logged recently, skipping duplicate',
      });
    }
    
    // ✅ STEP 3: UPSERT logic (insert or update)
    if (db && dbAvailable) {
      try {
        // Use PostgreSQL's ON CONFLICT to handle deduplication
        await db
          .insert(riskStats)
          .values({
            domain: normalizedDomain,
            riskLevel,
            firstSeen: new Date(),
            lastSeen: new Date(),
            hitCount: 1,
          })
          .onConflictDoUpdate({
            target: riskStats.domain,
            set: {
              lastSeen: new Date(),
              hitCount: sql`${riskStats.hitCount} + 1`,
              // Optionally update risk level if it changed
              riskLevel: riskLevel,
            },
          });
      } catch (err) {
        console.warn('DB write failed, using in-memory storage');
        dbAvailable = false;
        // Fallback to in-memory
        const existing = inMemoryStats.get(normalizedDomain);
        if (existing) {
          existing.hitCount++;
          existing.lastSeen = new Date();
          existing.riskLevel = riskLevel;
        } else {
          inMemoryStats.set(normalizedDomain, {
            domain: normalizedDomain,
            riskLevel,
            hitCount: 1,
            firstSeen: new Date(),
            lastSeen: new Date()
          });
        }
      }
    } else {
      // Use in-memory storage
      const existing = inMemoryStats.get(normalizedDomain);
      if (existing) {
        existing.hitCount++;
        existing.lastSeen = new Date();
        existing.riskLevel = riskLevel;
      } else {
        inMemoryStats.set(normalizedDomain, {
          domain: normalizedDomain,
          riskLevel,
          hitCount: 1,
          firstSeen: new Date(),
          lastSeen: new Date()
        });
      }
    }
    
    // Mark domain as logged (update cooldown)
    markAsLogged(normalizedDomain);
    
    // Return success
    res.status(201).json({
      logged: true,
      reason: 'untrusted_domain',
      message: dbAvailable ? 'Risk stat logged successfully' : 'Risk stat logged in memory (DB unavailable)',
    });
  } catch (error) {
    // Don't fail the request if stats logging fails (graceful degradation)
    console.error('Error logging stat (non-critical):', error);
    res.status(500).json({
      logged: false,
      reason: 'error',
      message: 'Stats logging failed',
    });
  }
});

/**
 * GET /api/stats/summary
 * Get aggregated statistics (for admin dashboard)
 * Shows unique domains, total hits, and risk distribution
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    let stats: any[] = [];
    
    // Try to get from DB first
    if (db && dbAvailable) {
      try {
        stats = await db.select().from(riskStats);
      } catch (err) {
        console.warn('DB read failed, using in-memory data');
        dbAvailable = false;
        stats = Array.from(inMemoryStats.values());
      }
    } else {
      // Use in-memory data
      stats = Array.from(inMemoryStats.values());
    }
    
    // Calculate totals
    const totalHits = stats.reduce((sum, s) => sum + (s.hitCount || 1), 0);
    
    const summary = {
      uniqueDomains: stats.length, // Number of unique untrusted domains
      totalHits, // Total visits across all domains
      dataSource: dbAvailable ? 'database' : 'in-memory',
      riskDistribution: {
        low: stats.filter(s => s.riskLevel === 'low').length,
        medium: stats.filter(s => s.riskLevel === 'medium').length,
        high: stats.filter(s => s.riskLevel === 'high').length,
      },
      topDomains: stats
        .sort((a, b) => (b.hitCount || 1) - (a.hitCount || 1))
        .slice(0, 10)
        .map(s => ({
          domain: s.domain,
          riskLevel: s.riskLevel,
          hitCount: s.hitCount,
          firstSeen: s.firstSeen,
          lastSeen: s.lastSeen,
        })),
    };
    
    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Error fetching stats summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
    });
  }
});

export default router;
