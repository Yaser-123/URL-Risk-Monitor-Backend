-- Add new trusted domains to database
-- Run this with: psql <your-database-url> -f add-new-domains.sql

INSERT INTO trusted_domains (domain, trust_level, source) VALUES
  -- Development Platforms & Cloud Infrastructure
  ('vercel.com', 'full', 'org'),
  ('heroku.com', 'full', 'org'),
  ('digitalocean.com', 'full', 'org'),
  ('postman.com', 'full', 'org'),
  ('kubernetes.io', 'full', 'org'),
  ('mongodb.com', 'full', 'org'),
  ('supabase.com', 'full', 'org'),
  ('pnpm.io', 'full', 'org'),
  ('stackexchange.com', 'full', 'org'),
  
  -- Academic & Engineering Research
  ('ieee.org', 'full', 'org'),
  ('ieeexplore.ieee.org', 'full', 'org'),
  ('acm.org', 'full', 'org'),
  ('dl.acm.org', 'full', 'org'),
  ('arxiv.org', 'full', 'org'),
  ('sciencedirect.com', 'full', 'org'),
  ('springer.com', 'full', 'org'),
  ('nature.com', 'full', 'org'),
  ('jstor.org', 'full', 'org'),
  ('researchgate.net', 'full', 'org'),
  ('scholar.google.com', 'full', 'org'),
  ('ncbi.nlm.nih.gov', 'full', 'org'),
  ('doaj.org', 'full', 'org'),
  ('webofscience.com', 'full', 'org'),
  ('scopus.com', 'full', 'org'),
  ('dblp.org', 'full', 'org'),
  
  -- Documentation & Standards
  ('developer.mozilla.org', 'full', 'org'),
  ('w3.org', 'full', 'org'),
  ('iso.org', 'full', 'org'),
  ('python.org', 'full', 'org'),
  ('react.dev', 'full', 'org'),
  ('nextjs.org', 'full', 'org')

ON CONFLICT (domain) DO NOTHING;

-- Show results
SELECT COUNT(*) as total_trusted_domains FROM trusted_domains;
SELECT domain FROM trusted_domains ORDER BY domain;
