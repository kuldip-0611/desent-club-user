import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'http', hostname: 'localhost', port: '3001' },
      {
        protocol: 'https',
        hostname:
          'desent-club-dev-assets-382720393179-ap-southeast-2-an.s3.ap-southeast-2.amazonaws.com',
      },
      { protocol: 'https', hostname: '*.s3.ap-southeast-2.amazonaws.com' },
    ],
  },
};

export default nextConfig;
