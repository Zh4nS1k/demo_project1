/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // The repo root has its own package.json (dev tooling) — point tracing
  // there so Next doesn't mis-infer the workspace root from the two lockfiles.
  outputFileTracingRoot: path.join(__dirname, '..'),

  // Proxy API calls to the Express backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
