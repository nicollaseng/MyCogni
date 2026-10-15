import {
  assessmentListSchema,
  careLinkListSchema,
  checkInDetailSchema,
  checkInListSchema,
  checkInQuerySchema,
  confirmSharingTermsSchema,
  patientSummaryListSchema,
  patientSummarySchema,
  professionalOverviewSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { forPatients, forProfessionals } from '../../plugins/account-type.ts'
import { currentUser } from '../../plugins/authentication.ts'
import type { CareLinkService } from './care-link.service.ts'
import type { PatientService } from './patient.service.ts'

const byPatient = z.object({ patientId: z.uuid() })

const byLink = z.object({ id: z.uuid() })

export function careLinkRoutes(
  links: CareLinkService,
  patients: PatientService,
): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/care-links',
      { config: forPatients, schema: { response: { 200: careLinkListSchema } } },
      (request) => links.list(currentUser(request)),
    )
    app.post(
      '/care-links/:id/end',
      { config: forPatients, schema: { params: byLink } },
      async (request, reply) => {
        await links.end(currentUser(request), request.params.id)
        return reply.status(204).send()
      },
    )
    app.post(
      '/care-links/:id/terms',
      { config: forPatients, schema: { params: byLink, body: confirmSharingTermsSchema } },
      async (request, reply) => {
        await links.confirmTerms(currentUser(request), request.params.id, request.body)
        return reply.status(204).send()
      },
    )
    app.get(
      '/professional/patients',
      { config: forProfessionals, schema: { response: { 200: patientSummaryListSchema } } },
      (request) => patients.list(currentUser(request)),
    )
    app.get(
      '/professional/overview',
      { config: forProfessionals, schema: { response: { 200: professionalOverviewSchema } } },
      (request) => patients.overview(currentUser(request)),
    )
    app.get(
      '/professional/patients/:patientId',
      {
        config: forProfessionals,
        schema: { params: byPatient, response: { 200: patientSummarySchema } },
      },
      (request) => patients.find(currentUser(request), request.params.patientId),
    )
    app.get(
      '/professional/patients/:patientId/check-ins',
      {
        config: forProfessionals,
        schema: {
          params: byPatient,
          querystring: checkInQuerySchema,
          response: { 200: checkInListSchema },
        },
      },
      (request) => patients.checkIns(currentUser(request), request.params.patientId, request.query),
    )
    app.get(
      '/professional/patients/:patientId/check-ins/:checkInId',
      {
        config: forProfessionals,
        schema: {
          params: byPatient.extend({ checkInId: z.uuid() }),
          response: { 200: checkInDetailSchema },
        },
      },
      (request) =>
        patients.checkIn(currentUser(request), request.params.patientId, request.params.checkInId),
    )
    app.get(
      '/professional/patients/:patientId/assessments',
      {
        config: forProfessionals,
        schema: { params: byPatient, response: { 200: assessmentListSchema } },
      },
      (request) => patients.assessments(currentUser(request), request.params.patientId),
    )
    done()
  }
}
