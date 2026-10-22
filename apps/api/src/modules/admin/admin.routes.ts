import {
  documentLinkSchema,
  professionalForReviewListSchema,
  professionalReviewDetailSchema,
  professionalReviewQuerySchema,
  reviewProfessionalSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { AdminService } from './admin.service.ts'

const professionalParams = z.object({ userId: z.uuid() })

export function adminRoutes(service: AdminService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/admin/professionals',
      {
        schema: {
          querystring: professionalReviewQuerySchema,
          response: { 200: professionalForReviewListSchema },
        },
      },
      (request) => service.professionals(currentUser(request), request.query),
    )
    app.get(
      '/admin/professionals/:userId',
      {
        schema: { params: professionalParams, response: { 200: professionalReviewDetailSchema } },
      },
      (request) => service.professional(currentUser(request), request.params.userId),
    )
    app.post(
      '/admin/professionals/:userId/review',
      { schema: { params: professionalParams, body: reviewProfessionalSchema } },
      async (request, reply) => {
        await service.review(currentUser(request), request.params.userId, request.body)
        return reply.status(204).send()
      },
    )
    app.get(
      '/admin/documents/:id/link',
      { schema: { params: z.object({ id: z.uuid() }), response: { 200: documentLinkSchema } } },
      (request) => service.documentLink(currentUser(request), request.params.id),
    )
    done()
  }
}
