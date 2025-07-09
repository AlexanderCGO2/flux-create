/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove export configuration - this is for Electron, not static export
  images: {
    unoptimized: true,
  },
  experimental: {
    // Enable Turbopack for faster development
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Webpack configuration for Electron compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = 'electron-renderer';
    }
    
    // Handle node modules in Electron
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };

    return config;
  },
  // Environment variables for AI integrations
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    FLUX_API_KEY: process.env.FLUX_API_KEY,
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },
};

module.exports = nextConfig;