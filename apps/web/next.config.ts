import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const commit = process.env.RAILWAY_GIT_COMMIT_SHA

const config: NextConfig = {
  output: 'standalone',
  deploymentId: commit === undefined || commit === '' ? undefined : commit,
  outputFileTracingRoot: fileURLToPath(new URL('../..', import.meta.url)),
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  agentRules: false,
  devIndicators: false,
  headers: () =>
    Promise.resolve([
      {
        source: '/audio/ambient/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]),
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl(config)
