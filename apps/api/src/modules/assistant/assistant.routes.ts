import {
  assistantConversationSchema,
  assistantExchangeSchema,
  assistantOverviewSchema,
  sendAssistantMessageSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { forPatients, forProfessionals } from '../../plugins/account-type.ts'
import { currentUser } from '../../plugins/authentication.ts'
import type { AssistantService } from './assistant.service.ts'

const byConversation = z.object({ id: z.uuid() })

const byPatient = z.object({ patientId: z.uuid() })

export function assistantRoutes(service: AssistantService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/assistant',
      { config: forPatients, schema: { response: { 200: assistantOverviewSchema } } },
      (request) => service.overview(currentUser(request), { mode: 'personal' }),
    )
    app.post(
      '/assistant/messages',
      {
        config: forPatients,
        schema: { body: sendAssistantMessageSchema, response: { 200: assistantExchangeSchema } },
      },
      (request) => service.send(currentUser(request), { mode: 'personal' }, request.body),
    )
    app.get(
      '/assistant/conversations/:id',
      { schema: { params: byConversation, response: { 200: assistantConversationSchema } } },
      (request) => service.conversation(currentUser(request), request.params.id),
    )
    app.delete(
      '/assistant/conversations/:id',
      { schema: { params: byConversation } },
      async (request, reply) => {
        await service.remove(currentUser(request), request.params.id)
        return reply.status(204).send()
      },
    )
    app.get(
      '/professional/patients/:patientId/assistant',
      {
        config: forProfessionals,
        schema: { params: byPatient, response: { 200: assistantOverviewSchema } },
      },
      (request) =>
        service.overview(currentUser(request), {
          mode: 'professional',
          patientId: request.params.patientId,
        }),
    )
    app.post(
      '/professional/patients/:patientId/assistant/messages',
      {
        config: forProfessionals,
        schema: {
          params: byPatient,
          body: sendAssistantMessageSchema,
          response: { 200: assistantExchangeSchema },
        },
      },
      (request) =>
        service.send(
          currentUser(request),
          { mode: 'professional', patientId: request.params.patientId },
          request.body,
        ),
    )
    done()
  }
}
