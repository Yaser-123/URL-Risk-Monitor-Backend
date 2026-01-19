# Deployment Guide

## Prerequisites

1. **Neon PostgreSQL Database**
   - Sign up at https://neon.tech/
   - Create a new project
   - Copy the connection string

2. **Deployment Platform** (choose one)
   - Railway.app
   - Render.com
   - Fly.io

---

## Step 1: Setup Neon Database

1. Go to https://console.neon.tech/
2. Create new project
3. Copy connection string (looks like):
   ```
   postgresql://user:pass@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Run migrations:
   ```bash
   npm run db:push
   ```
5. Seed data:
   ```bash
   # Use Neon SQL Editor or run seed-data.sql
   ```

---

## Step 2: Deploy to Railway

### Method 1: CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variable
railway variables set DATABASE_URL="your-neon-connection-string"

# Deploy
railway up
```

### Method 2: GitHub
1. Push code to GitHub
2. Go to https://railway.app/
3. "New Project" → "Deploy from GitHub"
4. Select repo
5. Add environment variables:
   - `DATABASE_URL`: Your Neon connection string
6. Deploy automatically

---

## Step 3: Deploy to Render

1. Push code to GitHub
2. Go to https://render.com/
3. "New +" → "Web Service"
4. Connect GitHub repo
5. Configure:
   - **Name**: url-risk-monitor-backend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Add environment variables:
   - `DATABASE_URL`: Your Neon connection string
7. Create Web Service

---

## Step 4: Deploy to Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch (creates fly.toml)
fly launch

# Set secrets
fly secrets set DATABASE_URL="your-neon-connection-string"

# Deploy
fly deploy
```

**fly.toml** (auto-generated):
```toml
app = "url-risk-monitor-backend"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "8080"

[[services]]
  http_checks = []
  internal_port = 8080
  protocol = "tcp"
```

---

## Step 5: Verify Deployment

Test your deployed API:

```bash
# Replace YOUR_DEPLOYMENT_URL with actual URL
curl https://YOUR_DEPLOYMENT_URL/

# Get trusted domains
curl https://YOUR_DEPLOYMENT_URL/api/trusted-domains

# Check specific domain
curl https://YOUR_DEPLOYMENT_URL/api/trusted-domains/google.com
```

---

## Step 6: Update Chrome Extension

In your extension's `content.js`, update the API URL:

```javascript
const API_BASE_URL = 'https://YOUR_DEPLOYMENT_URL';

async function fetchTrustedDomainsFromAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trusted-domains`);
    const data = await response.json();
    return data.domains;
  } catch (error) {
    console.error('Failed to fetch trusted domains:', error);
    return [];
  }
}
```

---

## Environment Variables Checklist

✅ `DATABASE_URL` - Neon PostgreSQL connection string  
✅ `PORT` - Server port (usually auto-set by platform)  
✅ `NODE_ENV` - Set to `production`

---

## Monitoring & Logs

### Railway
```bash
railway logs
```

### Render
- View logs in dashboard under "Logs" tab

### Fly.io
```bash
fly logs
```

---

## Custom Domain (Optional)

### Railway
1. Go to project settings
2. Add custom domain
3. Update DNS records

### Render
1. Go to "Settings" → "Custom Domain"
2. Add domain
3. Update DNS records

### Fly.io
```bash
fly certs add yourdomain.com
```

---

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Neon dashboard for connection details
- Ensure `?sslmode=require` is in connection string

### Port Issues
- Railway/Render auto-assign PORT
- Fly.io uses PORT 8080 by default
- Code reads `process.env.PORT` automatically

### CORS Issues
- Backend already has CORS enabled for all origins
- If issues persist, check browser console

### Build Failures
- Verify `package.json` scripts are correct
- Check Node.js version compatibility
- Review build logs for specific errors

---

## Production Checklist

- [ ] Database connection tested
- [ ] Migrations run successfully
- [ ] Seed data inserted
- [ ] API endpoints responding
- [ ] CORS working for extension
- [ ] Environment variables set
- [ ] Logs accessible
- [ ] Health check passing

---

## Next Steps

1. ✅ Deploy backend
2. ✅ Update extension with API URL
3. 🔄 Test integration
4. 📊 Monitor usage
5. 🚀 Demo ready!
