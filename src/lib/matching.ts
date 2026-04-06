/**
 * Check if a hostname matches an environment's URL pattern.
 * Simple substring match — pattern "app.dev1" matches "app.dev1.example.com".
 */
export function matchesHost(hostname: string, urlPattern: string): boolean {
  return hostname.includes(urlPattern);
}

/**
 * Check if a request URL matches a mock rule.
 */
export function matchesMock(
  method: string,
  pathname: string,
  mock: { method: string; pathname: string }
): boolean {
  return mock.method === method && mock.pathname === pathname;
}
