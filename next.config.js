/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Webpack configuration for Electron compatibility
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add polyfills for Node.js globals in client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Node.js polyfills
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        // Konva.js compatibility
        canvas: false,
      }

      // Provide global for browser
      config.plugins.push(
        new webpack.ProvidePlugin({
          global: 'globalThis',
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      )
    }

    // Handle .node files for native modules
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    })

    // Ignore specific modules that aren't needed in the browser
    config.resolve.alias = {
      ...config.resolve.alias,
      electron: false,
    }

    return config
  },

  // Logging is handled by Next.js built-in logging

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Asset optimization
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Electron-specific optimizations
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self' data: blob:;
              script-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob:;
              style-src 'self' 'unsafe-inline' data: blob:;
              img-src 'self' data: blob: https: http:;
              font-src 'self' data: blob:;
              connect-src 'self' data: blob: https: http: ws: wss:;
              media-src 'self' data: blob:;
              worker-src 'self' data: blob:;
              child-src 'self' data: blob:;
              frame-src 'self' data: blob:;
            `.replace(/\s+/g, ' ').trim()
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
    ]
  },
};

module.exports = nextConfig;