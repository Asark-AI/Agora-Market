export function trustedAppOrigin(configuredOrigin: string | undefined, isProduction: boolean): string | null {
  if (!configuredOrigin?.trim()) {
    return isProduction ? null : 'http://localhost:3000';
  }

  try {
    const parsed = new URL(configuredOrigin);
    if (
      (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && !isProduction)) ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}
