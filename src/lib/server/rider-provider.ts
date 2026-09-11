import 'server-only';

export type RiderProviderName = 'agora' | 'bolt';

export type RiderProviderStatus = {
  provider: RiderProviderName;
  enabled: boolean;
  configured: boolean;
};

/**
 * External rider-provider boundary. Agora remains the default provider.
 * Bolt integration is opt-in and must be enabled only with authorized access.
 */
export function getRiderProviderStatus(): RiderProviderStatus {
  const enabled = process.env.BOLT_DRIVER_API_ENABLED === 'true';
  const configured = Boolean(
    process.env.BOLT_DRIVER_API_BASE_URL &&
    process.env.BOLT_DRIVER_API_TOKEN,
  );

  return {
    provider: enabled && configured ? 'bolt' : 'agora',
    enabled,
    configured,
  };
}

export function assertBoltProviderEnabled(): void {
  const status = getRiderProviderStatus();
  if (status.provider !== 'bolt') {
    throw new Error('The external rider provider is not enabled or configured.');
  }
}
