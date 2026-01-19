/**
 * Normalize domain for consistent storage and comparison
 * Removes protocol, www, and converts to lowercase
 * 
 * Examples:
 *   https://www.Google.com/path -> google.com
 *   HTTP://Example.COM -> example.com
 *   www.github.com -> github.com
 */
export function normalizeDomain(urlOrDomain: string): string {
  if (!urlOrDomain || typeof urlOrDomain !== 'string') {
    throw new Error('Invalid domain input');
  }

  let domain = urlOrDomain.trim().toLowerCase();

  // Remove protocol (http://, https://, etc.)
  domain = domain.replace(/^[a-z]+:\/\//, '');

  // Remove www. prefix
  domain = domain.replace(/^www\./, '');

  // Extract hostname only (remove path, query, hash)
  domain = domain.split('/')[0].split('?')[0].split('#')[0];

  // Remove port if present
  domain = domain.split(':')[0];

  // Final validation
  if (!domain || domain.length === 0) {
    throw new Error('Invalid domain after normalization');
  }

  return domain;
}
