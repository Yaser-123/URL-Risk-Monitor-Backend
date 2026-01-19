// Script to add new trusted domains to database
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

const newDomains = [
  'vercel.com',
  'heroku.com',
  'digitalocean.com',
  'postman.com',
  'kubernetes.io',
  'mongodb.com',
  'supabase.com',
  'pnpm.io',
  'stackexchange.com',
  'ieee.org',
  'ieeexplore.ieee.org',
  'acm.org',
  'dl.acm.org',
  'arxiv.org',
  'sciencedirect.com',
  'springer.com',
  'nature.com',
  'jstor.org',
  'researchgate.net',
  'scholar.google.com',
  'ncbi.nlm.nih.gov',
  'doaj.org',
  'webofscience.com',
  'scopus.com',
  'dblp.org',
  'developer.mozilla.org',
  'w3.org',
  'iso.org',
  'python.org',
  'react.dev',
  'nextjs.org'
];

async function addDomains() {
  console.log('Adding new trusted domains...\n');
  
  for (const domain of newDomains) {
    try {
      await sql`
        INSERT INTO trusted_domains (domain, trust_level, source)
        VALUES (${domain}, 'full', 'org')
        ON CONFLICT (domain) DO NOTHING
      `;
      console.log('✓ Added:', domain);
    } catch (error: any) {
      console.log('✗ Failed:', domain, '-', error.message);
    }
  }
  
  // Get total count
  const result = await sql`SELECT COUNT(*) as count FROM trusted_domains`;
  console.log('\n✅ Total trusted domains in database:', result[0].count);
  
  process.exit(0);
}

addDomains();
