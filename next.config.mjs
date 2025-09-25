/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Vercel deployment
  output: 'standalone',
  // Disable static generation to avoid SSR issues with client-only components
  trailingSlash: true,
  // Custom server configuration
  serverRuntimeConfig: {
    // Server-side only config
  },
  publicRuntimeConfig: {
    // Client and server-side config
  },
  // Redirects for API routes to maintain existing Express routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*', // Proxy to Express server
      },
    ];
  },
  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has TypeScript type errors.
    ignoreBuildErrors: true,
  },
  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  // Disable static generation globally
  experimental: {
    appDir: true,
  },
  // Path mapping to match existing Vite setup
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
      '@shared': './shared',
      '@assets': './attached_assets',
    };
    return config;
  },
};

export default nextConfig;