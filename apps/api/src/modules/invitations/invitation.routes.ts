import {
  acceptInvitationSchema,
  attachedInvitationsSchema,
  careLinkSchema,
  claimInvitationSchema,
  createdInvitationSchema,
  createInvitationSchema,
  invitationCodeSchema,
  invitationPreviewSchema,
  receivedInvitationListSchema,
  receivedInvitationSchema,
  resendInvitationSchema,
  sentInvitationListSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { InvitationService } from './invitation.service.ts'

const byId = z.object({ id: z.uuid() })

const byCode = z.object({ code: invitationCodeSchema })

export function invitationRoutes(service: InvitationService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.post(
      '/invitations',
      { schema: { body: createInvitationSchema, response: { 201: createdInvitationSchema } } },
      async (request, reply) =>
        reply.status(201).send(await service.create(currentUser(request), request.body)),
    )
    app.get(
      '/invitations/sent',
      { schema: { response: { 200: sentInvitationListSchema } } },
      (request) => service.listSent(currentUser(request)),
    )
    app.post(
      '/invitations/:id/resend',
      {
        schema: {
          params: byId,
          body: resendInvitationSchema,
          response: { 201: createdInvitationSchema },
        },
      },
      async (request, reply) =>
        reply
          .status(201)
          .send(await service.resend(currentUser(request), request.params.id, request.body.locale)),
    )
    app.post('/invitations/:id/cancel', { schema: { params: byId } }, async (request, reply) => {
      await service.cancel(currentUser(request), request.params.id)
      return reply.status(204).send()
    })
    app.post(
      '/invitations/claim',
      { schema: { body: claimInvitationSchema, response: { 200: receivedInvitationSchema } } },
      (request) => service.claim(currentUser(request), request.body.code),
    )
    app.post(
      '/invitations/attach',
      { schema: { response: { 200: attachedInvitationsSchema } } },
      async (request) => ({ attached: await service.attach(currentUser(request)) }),
    )
    app.get(
      '/invitations/received',
      { schema: { response: { 200: receivedInvitationListSchema } } },
      (request) => service.listReceived(currentUser(request)),
    )
    app.get(
      '/invitations/received/:id',
      { schema: { params: byId, response: { 200: receivedInvitationSchema } } },
      (request) => service.findReceived(currentUser(request), request.params.id),
    )
    app.post(
      '/invitations/:id/accept',
      {
        schema: {
          params: byId,
          body: acceptInvitationSchema,
          response: { 201: careLinkSchema },
        },
      },
      async (request, reply) =>
        reply
          .status(201)
          .send(await service.accept(currentUser(request), request.params.id, request.body)),
    )
    app.post('/invitations/:id/decline', { schema: { params: byId } }, async (request, reply) => {
      await service.decline(currentUser(request), request.params.id)
      return reply.status(204).send()
    })
    done()
  }
}

export function invitationPublicRoutes(service: InvitationService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/invitations/preview/:code',
      { schema: { params: byCode, response: { 200: invitationPreviewSchema } } },
      (request) => service.preview(request.params.code),
    )
    done()
  }
}
