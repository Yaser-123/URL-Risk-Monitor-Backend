# 🚀 URL Risk Monitor Backend API

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-lightgrey.svg)](https://expressjs.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-orange.svg)](https://orm.drizzle.team/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A minimal, secure backend API for the URL Risk Monitor Chrome extension. Provides trusted domain allowlists and anonymous risk statistics logging using modern web technologies.

## ✨ Features

- 🔒 **Secure API**: No authentication required for read operations, CORS enabled for Chrome extensions
- 🗄️ **Database Integration**: PostgreSQL with Drizzle ORM for type-safe queries
- 🤖 **AI-Powered**: Integrated with Google Generative AI for advanced analysis
- 📊 **Statistics Tracking**: Anonymous logging of domain risk levels
- 🚀 **Production Ready**: Easy deployment to Railway, Render, or Fly.io
- 🔧 **Developer Friendly**: Hot reload development server, TypeScript support

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Chrome Extension Integration](#-chrome-extension-integration)
- [Security](#-security)
- [Scripts](#-scripts)
- [Testing](#-testing)
- [Contributing](#-contributing)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Google AI API key (optional, for AI features)

### Installation

1. **Clone and navigate to backend**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and optional API keys
   ```

4. **Database setup**
   ```bash
   # Generate and push schema
   npm run db:generate
   npm run db:push

   # Optional: Seed with initial data
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 📊 Database Schema

### Trusted Domains Table
```sql
CREATE TABLE trusted_domains (
  id SERIAL PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  trust_level TEXT NOT NULL DEFAULT 'full',
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Risk Statistics Table
```sql
CREATE TABLE risk_stats (
  id SERIAL PRIMARY KEY,
  domain TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000
```

### Health Check
```http
GET /
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-19T...",
  "version": "1.0.0"
}
```

### Trusted Domains

#### Get All Trusted Domains
```http
GET /api/trusted-domains
```
**Response:**
```json
{
  "success": true,
  "count": 3,
  "domains": ["google.com", "github.com", "microsoft.com"]
}
```

#### Check Specific Domain
```http
GET /api/trusted-domains/{domain}
```
**Response (trusted):**
```json
{
  "success": true,
  "trusted": true,
  "domain": "google.com",
  "trustLevel": "full",
  "source": "manual"
}
```

#### Add Trusted Domain (Admin)
```http
POST /api/trusted-domains
Content-Type: application/json

{
  "domain": "example.com",
  "trustLevel": "full",
  "source": "manual"
}
```

### Statistics

#### Log Risk Statistics
```http
POST /api/stats
Content-Type: application/json

{
  "domain": "suspicious-site.com",
  "riskLevel": "high"
}
```

#### Get Statistics Summary
```http
GET /api/stats/summary
```
**Response:**
```json
{
  "success": true,
  "totalEntries": 1250,
  "riskDistribution": {
    "low": 450,
    "medium": 600,
    "high": 200
  },
  "lastUpdated": "2024-01-19T..."
}
```

## 🌐 Deployment

### Railway 🚂
```bash
npm i -g @railway/cli
railway login
railway up
```

### Render ☁️
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

### Fly.io ✈️
```bash
curl -L https://fly.io/install.sh | sh
fly launch
fly deploy
```

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Google AI (Optional)
GOOGLE_AI_API_KEY=your_api_key_here

# Server
PORT=3000
NODE_ENV=production
```

## 📱 Chrome Extension Integration

### Fetch Trusted Domains
```javascript
async function fetchTrustedDomains() {
  try {
    const response = await fetch('https://your-backend.com/api/trusted-domains');
    const data = await response.json();
    return data.domains || [];
  } catch (error) {
    console.error('Failed to fetch trusted domains:', error);
    return [];
  }
}
```

### Check Domain Trust
```javascript
async function checkDomainTrust(domain) {
  try {
    const response = await fetch(`https://your-backend.com/api/trusted-domains/${domain}`);
    const data = await response.json();
    return data.trusted || false;
  } catch (error) {
    console.error('Failed to check domain:', error);
    return false;
  }
}
```

### Log Risk Statistics
```javascript
async function logRiskStat(domain, riskLevel) {
  try {
    await fetch('https://your-backend.com/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, riskLevel })
    });
  } catch (error) {
    console.warn('Failed to log risk stat:', error);
  }
}
```

## 🛡️ Security

- ✅ **Public Read Access**: No authentication for GET endpoints
- ✅ **CORS Enabled**: Configured for Chrome extension origins
- ✅ **Input Validation**: All endpoints validate and sanitize input
- ✅ **No User Tracking**: Anonymous statistics only
- ⚠️ **Rate Limiting**: Consider adding for production deployment
- ⚠️ **Authentication**: Add for POST endpoints in production

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio GUI |

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:3000/

# Get trusted domains
curl http://localhost:3000/api/trusted-domains

# Check specific domain
curl http://localhost:3000/api/trusted-domains/google.com

# Add trusted domain
curl -X POST http://localhost:3000/api/trusted-domains \
  -H "Content-Type: application/json" \
  -d '{"domain":"test.com","trustLevel":"full","source":"manual"}'

# Log statistics
curl -X POST http://localhost:3000/api/stats \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com","riskLevel":"medium"}'
```

### Automated Testing
```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database ORM by [Drizzle](https://orm.drizzle.team/)
- AI integration with [Google Generative AI](https://ai.google.dev/)
- Hosted on [Neon](https://neon.tech/)

---

**Made with ❤️ for web security**

### `risk_stats` Table
```sql
CREATE TABLE risk_stats (
  id SERIAL PRIMARY KEY,
  domain TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🔌 API Endpoints

### Health Check
```bash
GET /
```

### Get All Trusted Domains
```bash
curl http://localhost:3000/api/trusted-domains
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "domains": ["google.com", "github.com", "microsoft.com"]
}
```

### Check Specific Domain
```bash
curl http://localhost:3000/api/trusted-domains/google.com
```

**Response (trusted):**
```json
{
  "success": true,
  "trusted": true,
  "domain": "google.com",
  "trustLevel": "full",
  "source": "manual"
}
```

**Response (not trusted):**
```json
{
  "success": true,
  "trusted": false,
  "domain": "example.com"
}
```

### Add Trusted Domain (Admin)
```bash
curl -X POST http://localhost:3000/api/trusted-domains \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "google.com",
    "trustLevel": "full",
    "source": "manual"
  }'
```

### Log Anonymous Stats
```bash
curl -X POST http://localhost:3000/api/stats \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "riskLevel": "medium"
  }'
```

### Get Stats Summary
```bash
curl http://localhost:3000/api/stats/summary
```

## 🌐 Deployment

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Render
1. Connect GitHub repo
2. Set environment variables in dashboard
3. Deploy automatically

### Fly.io
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch
fly launch

# Deploy
fly deploy
```

## 🔐 Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
PORT=3000
NODE_ENV=production
```

## 📦 Chrome Extension Integration

### Fetch Trusted Domains
```javascript
async function fetchTrustedDomains() {
  const response = await fetch('https://your-backend.com/api/trusted-domains');
  const data = await response.json();
  return data.domains;
}
```

### Check Domain
```javascript
async function checkDomain(domain) {
  const response = await fetch(`https://your-backend.com/api/trusted-domains/${domain}`);
  const data = await response.json();
  return data.trusted;
}
```

### Log Stats (Optional)
```javascript
async function logRiskStat(domain, riskLevel) {
  await fetch('https://your-backend.com/api/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, riskLevel })
  });
}
```

## 🛡️ Security Notes

- ✅ No authentication (public read API)
- ✅ CORS enabled for Chrome extensions
- ✅ Input validation on all endpoints
- ✅ No IP logging or user tracking
- ⚠️ Add rate limiting for production
- ⚠️ Add authentication for POST endpoints

## 📝 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio (GUI)

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/

# Get trusted domains
curl http://localhost:3000/api/trusted-domains

# Check domain
curl http://localhost:3000/api/trusted-domains/google.com

# Add domain
curl -X POST http://localhost:3000/api/trusted-domains \
  -H "Content-Type: application/json" \
  -d '{"domain":"test.com","trustLevel":"full"}'

# Log stat
curl -X POST http://localhost:3000/api/stats \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com","riskLevel":"medium"}'
```

## 📈 Future Enhancements

- [ ] Add authentication for admin endpoints
- [ ] Implement rate limiting
- [ ] Add caching layer (Redis)
- [ ] Implement domain verification system
- [ ] Add community voting for domains
- [ ] Build admin dashboard
- [ ] Add webhooks for domain updates
