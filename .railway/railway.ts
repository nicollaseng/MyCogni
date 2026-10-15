import { defineRailway, github, preserve, project, service } from 'railway/iac'

export default defineRailway((ctx) => {
  const api = service('api', {
    source: github('nicollaseng/MyCogni', {
      branch: ctx.isEnvironment('production') ? 'main' : 'staging',
    }),
    build: {
      builder: 'DOCKERFILE',
      dockerfilePath: 'apps/api/Dockerfile',
      watchPatterns: ['apps/api/**', 'packages/**', 'package.json', 'pnpm-lock.yaml'],
    },
    deploy: {
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 5,
    },
    start: 'node apps/api/dist/server.js',
    preDeploy: 'node apps/api/dist/scripts/migrate.js',
    healthcheck: '/health',
    healthcheckTimeout: 60,
    replicas: { 'us-west2-aws': 1 },
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
      DATABASE_URL: preserve(),
      SUPABASE_URL: preserve(),
      CORS_ORIGINS: preserve(),
    },
  })

  return project('mycogni', { resources: [api] })
})
