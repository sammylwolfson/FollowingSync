/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone for Vercel
  output: 'standalone',
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLint configuration  
  eslint: {
    ignoreDuringBuilds: true,
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