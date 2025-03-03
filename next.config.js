/** @type {import('next').NextConfig} */

// Try to require next-pwa, but don't fail if it's not available
let withPWA;
try {
  withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development'
  });
} catch (e) {
  // If next-pwa is not available, use a passthrough function
  withPWA = (config) => config;
  console.warn('next-pwa module not found, PWA features will be disabled');
}

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['tzironis.gr'],
  },
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
  eslint: {
    // Disable ESLint during build for now (temporary solution)
    ignoreDuringBuilds: true,
  },
};

module.exports = withPWA(nextConfig); 