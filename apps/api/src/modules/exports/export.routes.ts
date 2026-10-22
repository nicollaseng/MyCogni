import {
  dataExportDownloadSchema,
  dataExportSchema,
  latestDataExportSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { DataExportService } from './export.service.ts'

const byId = z.object({ id: z.uuid() })

export function dataExportRoutes(service: DataExportService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.post(
      '/me/exports',
      { schema: { response: { 200: dataExportSchema, 202: dataExportSchema } } },
      async (request, reply) => {
        const { export: requested, created } = await service.request(currentUser(request))
        return reply.status(created ? 202 : 200).send(requested)
      },
    )
    app.get(
      '/me/exports/latest',
      { schema: { response: { 200: latestDataExportSchema } } },
      (request) => service.latest(currentUser(request)),
    )
    app.get(
      '/me/exports/:id/download',
      { schema: { params: byId, response: { 200: dataExportDownloadSchema } } },
      (request) => service.download(currentUser(request), request.params.id),
    )
    done()
  }
}
