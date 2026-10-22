import {
  answerQuestionnaireSchema,
  assignmentDetailSchema,
  createAssignmentSchema,
  patientQuestionnairesSchema,
  professionalAssignmentListSchema,
  professionalAssignmentSchema,
  questionnaireCatalogSchema,
  questionnaireRunSchema,
  startQuestionnaireSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { forPatients, forProfessionals } from '../../plugins/account-type.ts'
import { currentUser } from '../../plugins/authentication.ts'
import type { PatientQuestionnaireService } from './patient-questionnaire.service.ts'
import type { ProfessionalQuestionnaireService } from './professional-questionnaire.service.ts'

const byPatient = z.object({ patientId: z.uuid() })

const byAssignment = byPatient.extend({ assignmentId: z.uuid() })

const byId = z.object({ id: z.uuid() })

export function questionnaireRoutes(
  professional: ProfessionalQuestionnaireService,
  patient: PatientQuestionnaireService,
): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/professional/patients/:patientId/questionnaires/catalog',
      {
        config: forProfessionals,
        schema: { params: byPatient, response: { 200: questionnaireCatalogSchema } },
      },
      (request) => professional.catalog(currentUser(request), request.params.patientId),
    )
    app.get(
      '/professional/patients/:patientId/questionnaires',
      {
        config: forProfessionals,
        schema: { params: byPatient, response: { 200: professionalAssignmentListSchema } },
      },
      (request) => professional.list(currentUser(request), request.params.patientId),
    )
    app.post(
      '/professional/patients/:patientId/questionnaires',
      {
        config: forProfessionals,
        schema: {
          params: byPatient,
          body: createAssignmentSchema,
          response: { 201: professionalAssignmentSchema },
        },
      },
      async (request, reply) =>
        reply
          .status(201)
          .send(
            await professional.create(currentUser(request), request.params.patientId, request.body),
          ),
    )
    app.get(
      '/professional/patients/:patientId/questionnaires/:assignmentId',
      {
        config: forProfessionals,
        schema: { params: byAssignment, response: { 200: assignmentDetailSchema } },
      },
      (request) =>
        professional.detail(
          currentUser(request),
          request.params.patientId,
          request.params.assignmentId,
        ),
    )
    app.post(
      '/professional/patients/:patientId/questionnaires/:assignmentId/cancel',
      { config: forProfessionals, schema: { params: byAssignment } },
      async (request, reply) => {
        await professional.cancel(
          currentUser(request),
          request.params.patientId,
          request.params.assignmentId,
        )
        return reply.status(204).send()
      },
    )
    app.get(
      '/questionnaires',
      { config: forPatients, schema: { response: { 200: patientQuestionnairesSchema } } },
      (request) => patient.list(currentUser(request)),
    )
    app.get(
      '/questionnaires/:id',
      { config: forPatients, schema: { params: byId, response: { 200: questionnaireRunSchema } } },
      (request) => patient.run(currentUser(request), request.params.id),
    )
    app.post(
      '/questionnaires/:id/start',
      {
        config: forPatients,
        schema: {
          params: byId,
          body: startQuestionnaireSchema,
          response: { 200: questionnaireRunSchema },
        },
      },
      (request) => patient.start(currentUser(request), request.params.id, request.body),
    )
    app.patch(
      '/questionnaires/:id/answers',
      {
        config: forPatients,
        schema: {
          params: byId,
          body: answerQuestionnaireSchema,
          response: { 200: questionnaireRunSchema },
        },
      },
      (request) => patient.answer(currentUser(request), request.params.id, request.body),
    )
    app.post(
      '/questionnaires/:id/complete',
      {
        config: forPatients,
        schema: { params: byId, response: { 200: questionnaireRunSchema } },
      },
      (request) => patient.complete(currentUser(request), request.params.id),
    )
    done()
  }
}
