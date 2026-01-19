import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db';
import trustedRoutes from './routes/trusted';
import statsRoutes from './routes/stats';
import explainRoutes from './routes/explain';
import whoisRoutes from './routes/whois';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS for Chrome extension
app.use(cors({
  origin: '*', // Allow all origins (Chrome extensions need this)
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Parse JSON bodies
app.use(express.json());

// Request logging (simple)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'URL Risk Monitor Backend API',
    version: '1.0.0',
    endpoints: {
      trusted: '/api/trusted-domains',
      checkDomain: '/api/trusted-domains/:domain',
      stats: '/api/stats',
      explainRisk: '/api/explain-risk',
      whois: '/api/whois/:domain',
    },
  });
});

// API routes
app.use('/api/trusted-domains', trustedRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/explain-risk', explainRoutes);
app.use('/api/whois', whoisRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.warn('⚠️ Database connection failed - continuing without DB for testing');
    } else {
      console.log('✅ Database connected');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/`);
      console.log(`📍 Trusted domains: http://localhost:${PORT}/api/trusted-domains`);
      console.log(`📍 Stats: http://localhost:${PORT}/api/stats\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
