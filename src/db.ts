import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Make DATABASE_URL optional for demo/development
const DATABASE_URL = process.env.DATABASE_URL;

// Only create database connection if URL is provided
let sql: any = null;
let db: any = null;

if (DATABASE_URL) {
  try {
    sql = neon(DATABASE_URL);
    db = drizzle(sql, { schema });
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Export db (will be null if no DATABASE_URL)
export { db };

// Test connection
export async function testConnection() {
  if (!DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not set - running without database');
    return false;
  }
  
  if (!sql) {
    console.warn('⚠️ Database client not initialized');
    return false;
  }
  
  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ Database connected successfully:', result[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : error);
    return false;
  }
}
