import type { NextConfig } from 'next';
import path from 'path';
import fs from 'fs';

const isWorkspaceRoot = fs.existsSync(path.resolve(__dirname, '../pnpm-workspace.yaml'));

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: [
    '192.168.110.35',
    'localhost',
    '127.0.0.1',
    '*.trycloudflare.com',
    '*.loca.lt',
    '*.ngrok-free.app',
    '*.ngrok.app',
  ],
  turbopack: {
    root: isWorkspaceRoot ? path.resolve(__dirname, '..') : __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },
};

export default nextConfig;
