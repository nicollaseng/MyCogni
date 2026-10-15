import {
  assessmentListSchema,
  careLinkListSchema,
  checkInListSchema,
  checkInQuerySchema,
  patientSummaryListSchema,
  patientSummarySchema,
  professionalOverviewSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { CareLinkService } from './care-link.service.ts'
import type { PatientService } from './patient.service.ts'

const byPatient = z.object({ patientId: z.uuid() })

export function careLinkRoutes(
  links: CareLinkService,
  patients: PatientService,
): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get('/care-links', { schema: { response: { 200: careLinkListSchema } } }, (request) =>
      links.list(currentUser(request)),
    )
    app.post(
      '/care-links/:id/end',
      { schema: { params: z.object({ id: z.uuid() }) } },
      async (request, reply) => {
        await links.end(currentUser(request), request.params.id)
        return reply.status(204).send()
      },
    )
    app.get(
      '/professional/patients',
      { schema: { response: { 200: patientSummaryListSchema } } },
      (request) => patients.list(currentUser(request)),
    )
    app.get(
      '/professional/overview',
      { schema: { response: { 200: professionalOverviewSchema } } },
      (request) => patients.overview(currentUser(request)),
    )
    app.get(
      '/professional/patients/:patientId',
      { schema: { params: byPatient, response: { 200: patientSummarySchema } } },
      (request) => patients.find(currentUser(request), request.params.patientId),
    )
    app.get(
      '/professional/patients/:patientId/check-ins',
      {
        schema: {
          params: byPatient,
          querystring: checkInQuerySchema,
          response: { 200: checkInListSchema },
        },
      },
      (request) => patients.checkIns(currentUser(request), request.params.patientId, request.query),
    )
    app.get(
      '/professional/patients/:patientId/assessments',
      { schema: { params: byPatient, response: { 200: assessmentListSchema } } },
      (request) => patients.assessments(currentUser(request), request.params.patientId),
    )
    done()
  }
}
