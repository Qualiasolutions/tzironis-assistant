/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['tzironis.gr'],
  },
  serverExternalPackages: ['puppeteer'],
  eslint: {
    // Disable ESLint during build for now (temporary solution)
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 