import type { NextConfig } from 'next'

// Marketing-only deploy (Vercel): the backend-dependent routes are stripped by
// scripts/prepare-marketing-build.mjs. Their CTAs redirect to the landing page.
// NOTE: kept independent of NEXT_PUBLIC_APP_URL on purpose — pointing that var at the
// marketing domain itself caused a /login → /login self-redirect loop (ERR_TOO_MANY_REDIRECTS).
// When the real app is live on a separate domain (e.g. app.qorstack.com), point these there.
const isMarketingBuild = process.env.BUILD_TARGET === 'marketing'

const nextConfig: NextConfig = {
  // standalone is for self-host (Docker) only. On Vercel it can mishandle routing/
  // caching — VERCEL=1 is set automatically there, so disable it for Vercel builds.
  output: process.env.VERCEL ? undefined : 'standalone',
  reactStrictMode: true,
  async redirects() {
    if (!isMarketingBuild) return []
    return [
      { source: '/login', destination: '/', permanent: false },
      { source: '/create-project', destination: '/', permanent: false },
      { source: '/project/:path*', destination: '/', permanent: false }
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ]
      }
    ]
  },
  transpilePackages: ['pdfjs-dist'],
  serverExternalPackages: ['canvas'],
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.js'
    }
  },
  webpack: config => {
    config.resolve.alias.canvas = false
    return config
  }
}

export default nextConfig
