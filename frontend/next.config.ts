import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Force these packages to run in Node.js runtime, not the edge or bundled browser runtime
  serverExternalPackages: [
    'thread-stream', 
    'pino', 
    '@nillion/secretvaults',
    'pino-file' // often needed if using pino
  ],
  
  // 2. Output standalone is good for Docker builds
  output: 'standalone',

  // 3. Webpack config
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure we don't try to bundle these test files
      config.resolve.alias = {
        ...config.resolve.alias,
        'thread-stream/test': false,
        'thread-stream/bench': false,
      };
      
      // OPTIONAL: If you are using native modules or binary execution
      config.externals.push('child_process', 'fs', 'net');
    }
    return config;
  },
};

export default nextConfig;