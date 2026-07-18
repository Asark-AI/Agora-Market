/** @type {import('next').NextConfig} */

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
  webpack(config, { isServer, webpack }) {
    if (isServer) {
      // Ensure chunk filename template doesn't include folder prefix - runtime expects
      // to prepend the `chunks/` directory itself when requiring chunks.
      config.output = config.output || {};
      config.output.chunkFilename = '[id].js';
    }

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
