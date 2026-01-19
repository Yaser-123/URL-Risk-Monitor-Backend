# Quick Reference - Backend Optimization

## 🚀 Quick Start (30 seconds)

```bash
# 1. Start backend
cd backend
npm run dev

# 2. Test (in another terminal)
node test-backend.js

# Expected: All 9 tests pass ✅
```

---

## 📍 API Endpoints

### Health Check
```bash
GET http://localhost:3000/
```

### Add Trusted Domain
```bash
curl -X POST http://localhost:3000/api/trusted-domains \
  -H "Content-Type: application/json" \
  -d '{"domain": "github.com", "trust_level": "full", "source": "manual"}'
```

### Check if Domain is Trusted
```bash
curl http://localhost:3000/api/trusted-domains/google.com
```

### Get All Trusted Domains
```bash
curl http://localhost:3000/api/trusted-domains
```

### Log Risk Stat
```bash
curl -X POST http://localhost:3000/api/stats \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com", "riskLevel": "high"}'
```

### Get Stats Summary
```bash
curl http://localhost:3000/api/stats/summary
```

---

## 🧬 How It Works (3 Layers)

### Layer 1: Trusted Domain Filtering
```
Visit google.com → Check trusted_domains → Found → Skip logging ✅
Visit sketchy.com → Check trusted_domains → Not found → Continue ⬇️
```

### Layer 2: Rate Limiting (In-Memory)
```
First visit: sketchy.com → No cooldown → Continue ⬇️
Second visit (30s later): sketchy.com → Cooldown active → Skip ✅
Third visit (2 min later): sketchy.com → Cooldown expired → Continue ⬇️
```

### Layer 3: UPSERT Deduplication
```
First log: INSERT { domain: "sketchy.com", hit_count: 1 }
Second log: UPDATE { last_seen: NOW(), hit_count: 2 }
Third log: UPDATE { last_seen: NOW(), hit_count: 3 }

Result: 1 row, not 3 rows ✅
```

---

## 🎯 Key Features

| Feature | Implementation | Benefit |
|---------|---------------|---------|
| **Normalization** | Remove protocol/www/path | `HTTPS://WWW.Google.COM` → `google.com` |
| **Deduplication** | `UNIQUE(domain)` + UPSERT | 1 row per domain, not 1000 rows |
| **Rate Limiting** | 60s in-memory cooldown | Prevents DB spam |
| **Trusted Filter** | Check before insert | Google/GitHub not logged |
| **Privacy** | No IP, no user IDs | GDPR-friendly |

---

## 📊 Storage Math

**Before Optimization:**
```
100 sites × 10 visits = 1,000 DB rows
```

**After Optimization:**
```
Trusted sites (50): 0 rows (filtered)
Untrusted sites (50): 50 rows (UPSERT)
Rate-limited duplicates: 0 extra rows

Total: 50 rows (95% savings)
```

---

## 🔧 Configuration

### Rate Limit Cooldown
```typescript
// In src/routes/stats.ts
const DOMAIN_COOLDOWN_MS = 60 * 1000; // 1 minute

// To change: Edit this value
// 30 seconds: 30 * 1000
// 5 minutes: 5 * 60 * 1000
```

### Trust Levels
```typescript
// Valid options:
"full"        // Completely trusted (Google, Microsoft)
"login-safe"  // Safe for login (banks)
"info-only"   // Safe for browsing (news sites)
```

---

## 🐛 Troubleshooting

### "Backend won't start"
```bash
# Check DATABASE_URL
cat .env | grep DATABASE_URL

# Test connection
npm run db:push
```

### "Tests failing"
```bash
# Ensure migration ran
npm run db:push

# Check server is running
curl http://localhost:3000
```

### "Rate limit not working"
```bash
# Rate limit resets on server restart
# This is expected (in-memory storage)
# For persistent: Use Redis (production TODO)
```

### "Trusted domains not filtering"
```bash
# Check database
# In Neon SQL Editor:
SELECT * FROM trusted_domains WHERE domain = 'google.com';

# Should return 1 row
# If not, add it:
INSERT INTO trusted_domains (domain, trust_level, source) 
VALUES ('google.com', 'full', 'manual');
```

---

## 📁 File Locations

```
backend/
├── src/
│   ├── utils/
│   │   └── normalizeDomain.ts      # Domain cleanup
│   ├── routes/
│   │   ├── trusted.ts              # Trusted domain API
│   │   └── stats.ts                # Stats logging (OPTIMIZED)
│   ├── schema.ts                   # DB schema (OPTIMIZED)
│   ├── db.ts                       # Neon connection
│   └── index.ts                    # Express server
├── migrations/
│   └── 0001_optimize_risk_stats.sql # Migration script
├── test-backend.js                 # Test suite
├── OPTIMIZATION.md                 # Full documentation
├── IMPLEMENTATION_SUMMARY.md       # Complete summary
└── extension-integration-example.js # Extension integration
```

---

## 🎬 Demo Script (Judges)

**1. Show Backend Running**
```bash
npm run dev
# Point to console: "Database connected, server running on port 3000"
```

**2. Add Trusted Domain**
```bash
curl -X POST http://localhost:3000/api/trusted-domains \
  -H "Content-Type: application/json" \
  -d '{"domain": "https://www.Google.com/", "trust_level": "full"}'

# Point out: Input was "https://www.Google.com/"
#            Output shows "google.com" (normalized)
```

**3. Try Logging Trusted Domain**
```bash
curl -X POST http://localhost:3000/api/stats \
  -H "Content-Type: application/json" \
  -d '{"domain": "google.com", "riskLevel": "high"}'

# Point out: logged: false, reason: "trusted_domain"
# Explain: "Google visits don't pollute our security data"
```

**4. Log Untrusted Domain**
```bash
curl -X POST http://localhost:3000/api/stats \
  -H "Content-Type: application/json" \
  -d '{"domain": "sketchy-phishing-site.com", "riskLevel": "high"}'

# Point out: logged: true, reason: "untrusted_domain"
```

**5. Show Rate Limiting**
```bash
# Immediately repeat the same request
curl -X POST http://localhost:3000/api/stats \
  -H "Content-Type: application/json" \
  -d '{"domain": "sketchy-phishing-site.com", "riskLevel": "high"}'

# Point out: logged: false, reason: "rate_limited"
# Explain: "60-second cooldown prevents DB spam"
```

**6. Show Stats Summary**
```bash
curl http://localhost:3000/api/stats/summary

# Point out:
# - uniqueDomains: 1 (only sketchy site, not Google)
# - totalHits: 1 (deduplication working)
# - Storage: 1 row instead of 2+ rows
```

**7. Explain Storage Efficiency**
```
"In a real browsing session with 100 sites visited 10 times each:
- Without optimization: 1,000 DB rows
- With trusted filtering: 500 rows (50 sites are Google/GitHub)
- With deduplication: 50 rows (1 per unique domain)
- 95% storage savings, scales to millions of users"
```

---

## ✅ Checklist Before Demo

- [ ] Backend running (`npm run dev`)
- [ ] Migration applied (`npm run db:push`)
- [ ] Tests passing (`node test-backend.js` - all 9 ✅)
- [ ] Trusted domains seeded (at least google.com)
- [ ] Extension integrated (API_BASE_URL set)
- [ ] End-to-end test (visit site, check backend logs)

---

## 🎯 One-Liner Pitch

**"We built a privacy-first telemetry backend that reduces storage by 95% using trusted domain filtering, UPSERT deduplication, and in-memory rate limiting—no PII, no noise, just actionable security insights."**

---

## 📞 Quick Help

**Files to Read:**
1. `IMPLEMENTATION_SUMMARY.md` - Complete technical overview
2. `OPTIMIZATION.md` - Detailed documentation with examples
3. `test-backend.js` - Working test code
4. `extension-integration-example.js` - Copy-paste for extension

**Commands to Run:**
```bash
npm run dev          # Start server
node test-backend.js # Run tests
npm run db:push      # Apply migration
curl http://localhost:3000 # Health check
```

**Need Help?**
- Check logs: `console.log` in routes
- Check DB: Neon SQL Editor → `SELECT * FROM risk_stats;`
- Reset DB: Drop tables, re-run `npm run db:push`
