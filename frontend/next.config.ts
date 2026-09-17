import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.110.35', 'localhost', '127.0.0.1'],
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
};

export default nextConfig;
