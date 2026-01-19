# Backend Optimization Summary

## 🎯 What Changed

This backend now implements **smart telemetry** - it tracks security risks without creating noise or wasting storage.

---

## ✅ Implemented Features

### 1️⃣ **Trusted Domain Insertion**
**Endpoint:** `POST /api/trusted-domains`

**Request:**
```json
{
  "domain": "google.com",
  "trust_level": "full",
  "source": "manual"
}
```

**Behavior:**
- Normalizes domain (removes `https://`, `www.`, converts to lowercase)
- Rejects duplicates (409 Conflict)
- Returns inserted row on success

**⚠️ Security Note:** No authentication required for hackathon. Add auth before production.

---

### 2️⃣ **Optimized Schema (risk_stats)**

**New Structure:**
```sql
CREATE TABLE risk_stats (
  id SERIAL PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,  -- ✨ Key change: UNIQUE constraint
  risk_level TEXT NOT NULL,
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  hit_count INTEGER DEFAULT 1
);
```

**Why This Matters:**
- **Before:** Visiting `example.com` 1000 times = 1000 DB rows
- **After:** Visiting `example.com` 1000 times = 1 row with `hit_count=1000`
- **Result:** Database stays small even with heavy browsing

---

### 3️⃣ **Smart Logging (Untrusted Domains Only)**

**Flow:**
```
User visits domain
  ↓
Normalize domain
  ↓
Is it in trusted_domains?
  ├─ YES → Skip logging ✅
  └─ NO  → Continue ⬇️
         ↓
         Check rate limit (1-minute cooldown)
           ├─ YES → Skip (recently logged) ✅
           └─ NO  → Log to risk_stats ⬇️
                  ↓
                  UPSERT (insert or update)
                    ├─ New domain → INSERT
                    └─ Existing → UPDATE last_seen, hit_count++
```

**Example Scenarios:**

| Domain | Status | Action |
|--------|--------|--------|
| google.com | Trusted | ❌ Not logged |
| github.com | Trusted | ❌ Not logged |
| sketchy-phish.com | Untrusted | ✅ Logged (new row) |
| sketchy-phish.com (revisit) | Untrusted | ✅ Updated (hit_count++) |
| sketchy-phish.com (30s later) | Untrusted | ⏸️ Rate limited |

---

### 4️⃣ **Deduplication + Rate Limiting**

**UPSERT Logic (PostgreSQL):**
```typescript
await db.insert(riskStats)
  .values({ domain, riskLevel, firstSeen, lastSeen, hitCount: 1 })
  .onConflictDoUpdate({
    target: riskStats.domain,
    set: {
      lastSeen: new Date(),
      hitCount: sql`${riskStats.hitCount} + 1`,
      riskLevel: riskLevel, // Update if risk level changed
    },
  });
```

**In-Memory Rate Limiting:**
```typescript
const DOMAIN_COOLDOWN_MS = 60 * 1000; // 1 minute
const lastLoggedMap = new Map<string, number>();

function isRateLimited(domain: string): boolean {
  const lastLogged = lastLoggedMap.get(domain);
  if (!lastLogged) return false;
  return (Date.now() - lastLogged) < DOMAIN_COOLDOWN_MS;
}
```

**Why In-Memory?**
- ✅ Zero dependencies (no Redis needed)
- ✅ Perfect for single-instance hackathon deployment
- ✅ Prevents DB spam from browser tabs refreshing
- ⚠️ TODO: Replace with Redis for multi-instance production

---

### 5️⃣ **Domain Normalization**

**Utility Function:**
```typescript
normalizeDomain("HTTPS://WWW.Google.COM/path?query=1")
// Returns: "google.com"
```

**Rules:**
1. Remove protocol (`https://`, `http://`)
2. Remove `www.` prefix
3. Extract hostname only (no path/query)
4. Convert to lowercase
5. Remove port number

**Used Everywhere:**
- ✅ Trusted domain insertion
- ✅ Trusted domain lookup
- ✅ Risk stats logging
- ✅ Extension API calls

**Prevents Issues:**
- `Google.com` vs `google.com` → Same domain ✅
- `https://github.com` vs `github.com` → Same domain ✅
- `www.example.com` vs `example.com` → Same domain ✅

---

### 6️⃣ **Updated /api/stats Endpoint**

**Request:**
```json
POST /api/stats
{
  "domain": "example.com",
  "risk_level": "medium"
}
```

**Responses:**

**1. Trusted Domain (Not Logged):**
```json
{
  "logged": false,
  "reason": "trusted_domain",
  "message": "Domain is in trusted list, not logging stats"
}
```

**2. Rate Limited:**
```json
{
  "logged": false,
  "reason": "rate_limited",
  "message": "Domain logged recently, skipping duplicate"
}
```

**3. Successfully Logged:**
```json
{
  "logged": true,
  "reason": "untrusted_domain",
  "message": "Risk stat logged successfully"
}
```

---

## 📊 Storage Efficiency

### Before Optimization:
```
User browses 100 unique sites, 10 visits each
= 100 × 10 = 1,000 DB rows
```

### After Optimization:
```
User browses 100 unique sites, 10 visits each
But 50 are trusted (Google, GitHub, etc.)
= 50 untrusted sites × 1 row each = 50 DB rows
(hit_count tracks revisits)
```

**Storage Savings: 95%+**

---

## 🔧 Migration Instructions

### Option A: Using Drizzle Kit (Recommended)
```bash
# 1. Update schema
npm run db:push

# 2. Drizzle will detect changes and prompt you
# It will add: first_seen, last_seen, hit_count, UNIQUE constraint
```

### Option B: Manual SQL Migration
```bash
# Run migration file in Neon SQL Editor
cat migrations/0001_optimize_risk_stats.sql
# Copy and paste into Neon dashboard
```

**Migration Steps:**
1. Add new columns (`first_seen`, `last_seen`, `hit_count`)
2. Populate existing rows with default values
3. Add `UNIQUE(domain)` constraint
4. Create performance indexes
5. Optionally drop old `timestamp` column

---

## 🧪 Testing

### Test 1: Add Trusted Domain
```bash
curl -X POST http://localhost:3000/api/trusted-domains \
  -H "Content-Type: application/json" \
  -d '{"domain": "google.com", "trust_level": "full"}'
```

**Expected:** `201 Created` with domain details

### Test 2: Try to Add Duplicate
```bash
curl -X POST http://localhost:3000/api/trusted-domains \
  -H "Content-Type: application/json" \
  -d '{"domain": "google.com", "trust_level": "full"}'
```

**Expected:** `409 Conflict` - "Domain already exists"

### Test 3: Log Trusted Domain (Should Skip)
```bash
curl -X POST http://localhost:3000/api/stats \
  -H "Content-Type: application/json" \
  -d '{"domain": "google.com", "riskLevel": "high"}'
```

**Expected:**
```json
{
  "logged": false,
  "reason": "trusted_domain"
}
```

### Test 4: Log Untrusted Domain
```bash
curl -X POST http://localhost:3000/api/stats \
  -H "Content-Type: application/json" \
  -d '{"domain": "sketchy-site.com", "riskLevel": "high"}'
```

**Expected:**
```json
{
  "logged": true,
  "reason": "untrusted_domain"
}
```

### Test 5: Log Same Domain Again (Rate Limited)
```bash
# Immediately repeat the above request
curl -X POST http://localhost:3000/api/stats \
  -H "Content-Type: application/json" \
  -d '{"domain": "sketchy-site.com", "riskLevel": "high"}'
```

**Expected:**
```json
{
  "logged": false,
  "reason": "rate_limited"
}
```

### Test 6: Check Stats Summary
```bash
curl http://localhost:3000/api/stats/summary
```

**Expected:**
```json
{
  "success": true,
  "summary": {
    "uniqueDomains": 1,
    "totalHits": 1,
    "riskDistribution": { "low": 0, "medium": 0, "high": 1 },
    "topDomains": [
      {
        "domain": "sketchy-site.com",
        "riskLevel": "high",
        "hitCount": 1,
        "firstSeen": "2026-01-17T...",
        "lastSeen": "2026-01-17T..."
      }
    ]
  }
}
```

---

## 📲 Extension Integration

### How Extension Should Call API

**Step 1: Check if Domain is Risky**
```javascript
// In content.js
const riskLevel = getDomainRiskLevel(window.location.hostname);

if (riskLevel === 'medium' || riskLevel === 'high') {
  // Show warning banner
  showWarningBanner(riskLevel);
  
  // Log to backend (fire-and-forget)
  logRiskStat(window.location.hostname, riskLevel);
}
```

**Step 2: Log to Backend**
```javascript
async function logRiskStat(domain, riskLevel) {
  try {
    const response = await fetch('https://your-backend.com/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, riskLevel }),
    });
    
    const result = await response.json();
    console.log('Stats logged:', result.logged, result.reason);
  } catch (error) {
    // Graceful degradation - extension works even if backend is down
    console.warn('Stats logging failed (non-critical):', error);
  }
}
```

**Key Points:**
- ✅ Extension works offline (backend is optional)
- ✅ Backend filters trusted domains (no noise)
- ✅ Rate limiting prevents spam
- ✅ UPSERT prevents duplicate rows

---

## 🎓 Judge Explanation

**Q: "Why is your database so small despite heavy browsing?"**

**A:** Three-layer optimization:
1. **Trusted domain filtering** - We don't log Google/GitHub (40+ sites)
2. **Deduplication** - Same domain = 1 row with hit counter
3. **Rate limiting** - Same domain can't spam DB within 1-minute window

**Q: "How do you prevent abuse?"**

**A:** 
1. **In-memory rate limiting** - 1-minute cooldown per domain
2. **Database constraints** - `UNIQUE(domain)` prevents duplicates
3. **Trusted domain bypass** - Legitimate sites never logged
4. **No PII** - Zero IP addresses, zero user identifiers

**Q: "What happens if backend goes down?"**

**A:** Extension works 100% offline. Backend is telemetry-only, not critical path.

---

## 🚀 Next Steps

1. **Run migration:**
   ```bash
   cd backend
   npm run db:push
   ```

2. **Seed trusted domains:**
   ```bash
   # Use Neon SQL Editor or run:
   psql $DATABASE_URL < seed-data.sql
   ```

3. **Test locally:**
   ```bash
   npm run dev
   # Use curl commands above to verify
   ```

4. **Deploy to Railway/Render:**
   ```bash
   # Set DATABASE_URL env variable
   # Deploy and get production URL
   ```

5. **Update extension:**
   ```javascript
   // In extension/content.js
   const API_BASE_URL = 'https://your-backend.railway.app';
   ```

---

## 📝 Summary

**What You Built:**
- ✅ Efficient telemetry backend (lean storage)
- ✅ Trusted domain API (with normalization)
- ✅ Smart logging (untrusted domains only)
- ✅ Deduplication (UPSERT pattern)
- ✅ Rate limiting (in-memory cooldown)
- ✅ Privacy-first (no PII)

**Storage Efficiency:**
- Before: O(n) rows per browsing session
- After: O(unique untrusted domains)
- Typical savings: **90-95%**

**Judge-Defensible:**
- ✅ Scalable design
- ✅ Privacy-preserving
- ✅ Production-ready patterns (UPSERT, rate limiting)
- ✅ Clear TODO markers for auth/Redis
