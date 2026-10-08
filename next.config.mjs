/** @type {import('next').NextConfig} */

process.env.NEXT_DISABLE_FONT_DOWNLOAD = process.env.NEXT_DISABLE_FONT_DOWNLOAD || '1';

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/reset-password',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        source: '/admin/reset-password',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
  webpack(config) {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      (warning) => {
        const message = warning.message || '';
        const resource = warning.module?.resource || '';
        return (
          message.includes(
            'Critical dependency: require function is used in a way in which dependencies cannot be statically extracted'
          ) &&
          (resource.includes('require-in-the-middle') || resource.includes('@opentelemetry/sdk-node'))
        );
      },
    ];

    return config;
  },
};

export default nextConfig;
