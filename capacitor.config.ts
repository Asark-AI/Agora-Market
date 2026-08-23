import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agora.market',
  appName: 'Agora Market',
  webDir: 'public',
  server: {
    url: 'https://agora-market-7s2m.vercel.app/',
    cleartext: false,
  },
};

export default config;