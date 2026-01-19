import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

/**
 * Trusted domains table
 * Stores verified/safe domains that the extension should trust
 */
export const trustedDomains = pgTable('trusted_domains', {
  id: serial('id').primaryKey(),
  domain: text('domain').notNull().unique(),
  trustLevel: text('trust_level').notNull().default('full'), // 'full', 'login-safe', 'info-only'
  source: text('source').notNull().default('manual'), // 'manual', 'org', 'community'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Risk statistics table (OPTIMIZED)
 * Anonymous logging of risk assessments for analytics
 * NO IP addresses, NO user identifiers
 * 
 * DEDUPLICATION STRATEGY:
 * - UNIQUE(domain) ensures same domain logged only once
 * - Re-visits increment hit_count instead of creating new rows
 * - Keeps storage minimal even with heavy browsing
 */
export const riskStats = pgTable('risk_stats', {
  id: serial('id').primaryKey(),
  domain: text('domain').notNull().unique(), // ✨ UNIQUE constraint prevents duplicates
  riskLevel: text('risk_level').notNull(), // 'low', 'medium', 'high'
  firstSeen: timestamp('first_seen').defaultNow().notNull(), // Initial detection
  lastSeen: timestamp('last_seen').defaultNow().notNull(), // Most recent visit
  hitCount: integer('hit_count').notNull().default(1), // Number of visits
});

// Type exports for TypeScript
export type TrustedDomain = typeof trustedDomains.$inferSelect;
export type NewTrustedDomain = typeof trustedDomains.$inferInsert;
export type RiskStat = typeof riskStats.$inferSelect;
export type NewRiskStat = typeof riskStats.$inferInsert;
