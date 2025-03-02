/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['tzironis.gr'],
  },
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
};

module.exports = nextConfig; 