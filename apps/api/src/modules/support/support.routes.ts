import {
  adminSupportQuerySchema,
  adminSupportTicketListSchema,
  adminSupportTicketSchema,
  changeSupportStatusSchema,
  createdSupportTicketSchema,
  createSupportTicketSchema,
  documentLinkSchema,
  supportTicketListSchema,
  supportTicketSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { SupportService } from './support.service.ts'

const ticketParams = z.object({ id: z.uuid() })

export function supportRoutes(service: SupportService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.post(
      '/support/tickets',
      {
        schema: { body: createSupportTicketSchema, response: { 201: createdSupportTicketSchema } },
      },
      async (request, reply) =>
        reply.status(201).send(await service.create(currentUser(request), request.body)),
    )
    app.get(
      '/support/tickets',
      { schema: { response: { 200: supportTicketListSchema } } },
      (request) => service.list(currentUser(request)),
    )
    app.get(
      '/support/tickets/:id',
      { schema: { params: ticketParams, response: { 200: supportTicketSchema } } },
      (request) => service.find(currentUser(request), request.params.id),
    )
    app.get(
      '/admin/support/tickets',
      {
        schema: {
          querystring: adminSupportQuerySchema,
          response: { 200: adminSupportTicketListSchema },
        },
      },
      (request) => service.listForAdmin(currentUser(request), request.query),
    )
    app.get(
      '/admin/support/tickets/:id',
      { schema: { params: ticketParams, response: { 200: adminSupportTicketSchema } } },
      (request) => service.findForAdmin(currentUser(request), request.params.id),
    )
    app.get(
      '/admin/support/tickets/:id/attachment',
      { schema: { params: ticketParams, response: { 200: documentLinkSchema } } },
      (request) => service.attachmentLink(currentUser(request), request.params.id),
    )
    app.post(
      '/admin/support/tickets/:id/status',
      {
        schema: {
          params: ticketParams,
          body: changeSupportStatusSchema,
          response: { 200: adminSupportTicketSchema },
        },
      },
      (request) => service.changeStatus(currentUser(request), request.params.id, request.body),
    )
    done()
  }
}
