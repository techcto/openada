import type { NextConfig } from 'next'
import path from 'path'

const apiOrigin = (() => {
  const envApiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_HOST

  if (envApiUrl) {
    return envApiUrl.replace(/\/+$/, '')
  }

  const apiHost = process.env.API_HOST || 'api'
  const apiPort = process.env.API_PORT || '3001'
  return `http://${apiHost}:${apiPort}`
})()

const nextConfig: NextConfig = {
  reactStrictMode: true,
  pageExtensions: ['openada.tsx'],
  async rewrites() {
    const publicPageRewrites = [
      {
        source: '/support',
        destination: '/api-reference',
      },
      {
        source: '/privacy',
        destination: '/docs/privacy',
      },
      {
        source: '/terms',
        destination: '/docs/terms',
      },
    ]

    const directoryRewrites = [
      {
        source: '/directory/:site/scans/:scan/pages/:page',
        destination: '/directory?site=:site&scan=:scan&page=:page',
      },
      {
        source: '/directory/:site/scans/:scan',
        destination: '/directory?site=:site&scan=:scan',
      },
      {
        source: '/directory/:site',
        destination: '/directory?site=:site',
      },
    ]

    // Production traffic stays same-origin so the ALB can route /api/* to ECS.
    if (process.env.NODE_ENV === 'production') return [...publicPageRewrites, ...directoryRewrites]

    return [
      ...publicPageRewrites,
      ...directoryRewrites,
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ]
  },
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.APP_ENV,
  },
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'src', 'sass')],
    quietDeps: true,
    silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
  },
}

export default nextConfig
