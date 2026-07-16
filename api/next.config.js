/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['openada.ts'],
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
