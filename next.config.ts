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
    // Production traffic stays same-origin so the ALB can route /api/* to ECS.
    if (process.env.NODE_ENV === 'production') return []

    return [
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
