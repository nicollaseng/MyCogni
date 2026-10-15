import { defineRailway, github, preserve, project, service } from 'railway/iac'

export default defineRailway((ctx) => {
  const source = github('nicollaseng/MyCogni', {
    branch: ctx.isEnvironment('production') ? 'main' : 'staging',
  })
  const workspace = ['packages/**', 'package.json', 'pnpm-lock.yaml']
  const deploy = { restartPolicyType: 'ON_FAILURE' as const, restartPolicyMaxRetries: 5 }
  const replicas = { 'us-west2-aws': 1 }

  const api = service('api', {
    source,
    build: {
      builder: 'DOCKERFILE',
      dockerfilePath: 'apps/api/Dockerfile',
      watchPatterns: ['apps/api/**', ...workspace],
    },
    deploy,
    start: 'node apps/api/dist/server.js',
    preDeploy: 'node apps/api/dist/scripts/migrate.js',
    healthcheck: '/health',
    healthcheckTimeout: 60,
    replicas,
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
      DATABASE_URL: preserve(),
      SUPABASE_URL: preserve(),
      SUPABASE_SECRET_KEY: preserve(),
      CORS_ORIGINS: preserve(),
    },
  })

  const web = service('web', {
    source,
    build: {
      builder: 'DOCKERFILE',
      dockerfilePath: 'apps/web/Dockerfile',
      watchPatterns: ['apps/web/**', ...workspace],
    },
    deploy,
    start: 'node apps/web/server.js',
    healthcheck: '/',
    healthcheckTimeout: 60,
    replicas,
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: preserve(),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: preserve(),
      API_URL: preserve(),
      SITE_URL: preserve(),
    },
  })

  return project('mycogni', { resources: [api, web] })
})
