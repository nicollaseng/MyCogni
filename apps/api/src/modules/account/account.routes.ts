import { accountExportSchema } from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { AccountService } from './account.service.ts'

export function accountRoutes(service: AccountService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get('/me/export', { schema: { response: { 200: accountExportSchema } } }, (request) =>
      service.export(currentUser(request)),
    )
    app.delete('/me', async (request, reply) => {
      await service.delete(currentUser(request))
      return reply.status(204).send()
    })
    done()
  }
}
