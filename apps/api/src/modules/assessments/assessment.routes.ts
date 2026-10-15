import { assessmentListSchema, assessmentSchema, submitAssessmentSchema } from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { AssessmentService } from './assessment.service.ts'

export function assessmentRoutes(service: AssessmentService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get('/assessments', { schema: { response: { 200: assessmentListSchema } } }, (request) =>
      service.list(currentUser(request)),
    )
    app.post(
      '/assessments',
      { schema: { body: submitAssessmentSchema, response: { 201: assessmentSchema } } },
      async (request, reply) =>
        reply.status(201).send(await service.submit(currentUser(request), request.body)),
    )
    done()
  }
}
