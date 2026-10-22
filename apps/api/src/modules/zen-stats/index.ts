import { zenStatsSchema } from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { currentUser } from '../../plugins/authentication.ts'
import { createZenStatsRepository } from './zen-stats.repository.ts'
import { createZenStatsService } from './zen-stats.service.ts'

export function zenStatsModule(db: Database): FastifyPluginCallbackZod {
  const service = createZenStatsService(createZenStatsRepository(db))
  return (app, _options, done) => {
    app.get('/admin/zen', { schema: { response: { 200: zenStatsSchema } } }, (request) =>
      service.stats(currentUser(request)),
    )
    done()
  }
}
