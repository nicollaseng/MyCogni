import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

const healthResponse = z.object({ status: z.literal('ok') })

export const healthRoutes: FastifyPluginCallbackZod = (app, _options, done) => {
  app.get('/health', { schema: { response: { 200: healthResponse } } }, () => ({
    status: 'ok' as const,
  }))
  done()
}
