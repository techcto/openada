/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['openada.ts'],
  async rewrites() {
    return [
      { source: '/mcp', destination: '/api/mcp' },
      { source: '/.well-known/openai-apps-challenge', destination: '/api/openai-apps-challenge' },
    ]
  },
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
