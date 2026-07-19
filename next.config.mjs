/** @type {import('next').NextConfig} */

process.env.NEXT_DISABLE_FONT_DOWNLOAD = process.env.NEXT_DISABLE_FONT_DOWNLOAD || '1';

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
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
