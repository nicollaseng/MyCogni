import { moodReportQuerySchema } from '@mycogni/contracts'
import type { FastifyReply } from 'fastify'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { ReportFile, ReportService } from './report.service.ts'

function sendPdf(reply: FastifyReply, file: ReportFile): FastifyReply {
  return reply
    .header('content-type', 'application/pdf')
    .header('content-disposition', `attachment; filename="${file.fileName}"`)
    .header('cache-control', 'no-store')
    .send(file.content)
}

export function reportRoutes(service: ReportService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/reports/mood',
      { schema: { querystring: moodReportQuerySchema } },
      async (request, reply) =>
        sendPdf(reply, await service.mine(currentUser(request), request.query)),
    )
    app.get(
      '/professional/patients/:patientId/reports/mood',
      {
        schema: {
          params: z.object({ patientId: z.uuid() }),
          querystring: moodReportQuerySchema,
        },
      },
      async (request, reply) =>
        sendPdf(
          reply,
          await service.ofPatient(currentUser(request), request.params.patientId, request.query),
        ),
    )
    done()
  }
}
