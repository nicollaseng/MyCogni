import {
  createJournalShareSchema,
  journalAccessListSchema,
  journalEntrySchema,
  journalEntrySummaryListSchema,
  journalQuerySchema,
  journalShareListSchema,
  journalShareSchema,
  updateJournalEntrySchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { JournalService } from './journal.service.ts'
import type { SharedJournalService } from './shared-journal.service.ts'

const byId = z.object({ id: z.uuid() })

const byPatient = z.object({ patientId: z.uuid() })

export function journalRoutes(
  journal: JournalService,
  shared: SharedJournalService,
): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/journal',
      {
        schema: {
          querystring: journalQuerySchema,
          response: { 200: journalEntrySummaryListSchema },
        },
      },
      (request) => journal.list(currentUser(request), request.query),
    )
    app.post(
      '/journal',
      { schema: { response: { 201: journalEntrySchema } } },
      async (request, reply) => reply.status(201).send(await journal.create(currentUser(request))),
    )
    app.get(
      '/journal/shares',
      { schema: { response: { 200: journalShareListSchema } } },
      (request) => journal.shares(currentUser(request)),
    )
    app.post(
      '/journal/shares',
      { schema: { body: createJournalShareSchema, response: { 201: journalShareSchema } } },
      async (request, reply) =>
        reply.status(201).send(await journal.share(currentUser(request), request.body)),
    )
    app.post('/journal/shares/:id/revoke', { schema: { params: byId } }, async (request, reply) => {
      await journal.revoke(currentUser(request), request.params.id)
      return reply.status(204).send()
    })
    app.get(
      '/journal/shares/:id/access',
      { schema: { params: byId, response: { 200: journalAccessListSchema } } },
      (request) => journal.access(currentUser(request), request.params.id),
    )
    app.get(
      '/journal/:id',
      { schema: { params: byId, response: { 200: journalEntrySchema } } },
      (request) => journal.get(currentUser(request), request.params.id),
    )
    app.put(
      '/journal/:id',
      {
        bodyLimit: 1_048_576,
        schema: {
          params: byId,
          body: updateJournalEntrySchema,
          response: { 200: journalEntrySchema },
        },
      },
      (request) => journal.update(currentUser(request), request.params.id, request.body),
    )
    app.delete('/journal/:id', { schema: { params: byId } }, async (request, reply) => {
      await journal.remove(currentUser(request), request.params.id)
      return reply.status(204).send()
    })
    app.get(
      '/professional/patients/:patientId/journal',
      {
        schema: {
          params: byPatient,
          querystring: journalQuerySchema,
          response: { 200: journalEntrySummaryListSchema },
        },
      },
      (request) => shared.list(currentUser(request), request.params.patientId, request.query),
    )
    app.get(
      '/professional/patients/:patientId/journal/:id',
      {
        schema: {
          params: byPatient.extend({ id: z.uuid() }),
          response: { 200: journalEntrySchema },
        },
      },
      (request) => shared.get(currentUser(request), request.params.patientId, request.params.id),
    )
    done()
  }
}
