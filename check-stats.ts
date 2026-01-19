import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function checkRiskStats() {
  console.log('Checking risk_stats table...\n');
  
  const result = await sql`
    SELECT domain, risk_level, hit_count, first_seen, last_seen 
    FROM risk_stats 
    ORDER BY last_seen DESC 
    LIMIT 20
  `;
  
  if (result.length === 0) {
    console.log('❌ No entries found in risk_stats table!');
    console.log('\nThis could mean:');
    console.log('1. Backend is not receiving requests from extension');
    console.log('2. Domains are being filtered as trusted');
    console.log('3. Rate limiting is preventing logging');
  } else {
    console.log(`✓ Found ${result.length} entries:\n`);
    result.forEach((row, i) => {
      console.log(`${i + 1}. ${row.domain}`);
      console.log(`   Risk: ${row.risk_level} | Hits: ${row.hit_count}`);
      console.log(`   Last seen: ${row.last_seen}`);
      console.log('');
    });
  }
  
  process.exit(0);
}

checkRiskStats();
