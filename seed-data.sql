-- Seed data for trusted domains
-- Run this after creating tables to populate initial trusted domains

INSERT INTO trusted_domains (domain, trust_level, source) VALUES
  -- Major tech companies
  ('google.com', 'full', 'org'),
  ('github.com', 'full', 'org'),
  ('microsoft.com', 'full', 'org'),
  ('apple.com', 'full', 'org'),
  ('amazon.com', 'full', 'org'),
  
  -- Social media
  ('facebook.com', 'full', 'org'),
  ('twitter.com', 'full', 'org'),
  ('linkedin.com', 'full', 'org'),
  ('instagram.com', 'full', 'org'),
  ('reddit.com', 'full', 'org'),
  
  -- Cloud & DevOps
  ('gitlab.com', 'full', 'org'),
  ('bitbucket.org', 'full', 'org'),
  ('stackoverflow.com', 'full', 'org'),
  ('npmjs.com', 'full', 'org'),
  ('docker.com', 'full', 'org'),
  
  -- Media & Entertainment
  ('youtube.com', 'full', 'org'),
  ('netflix.com', 'full', 'org'),
  ('spotify.com', 'full', 'org'),
  ('twitch.tv', 'full', 'org'),
  
  -- Productivity
  ('slack.com', 'full', 'org'),
  ('notion.so', 'full', 'org'),
  ('dropbox.com', 'full', 'org'),
  ('zoom.us', 'full', 'org'),
  
  -- Education & Reference
  ('wikipedia.org', 'full', 'org'),
  ('medium.com', 'full', 'org'),
  ('coursera.org', 'full', 'org'),
  ('udemy.com', 'full', 'org'),
  
  -- Payment & Finance
  ('paypal.com', 'full', 'org'),
  ('stripe.com', 'full', 'org'),
  
  -- Adobe
  ('adobe.com', 'full', 'org'),
  
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

-- Verify insertion
SELECT COUNT(*) as total_trusted_domains FROM trusted_domains;
