import {
  createJournalShareSchema,
  journalAccessListSchema,
  journalEntryPageSchema,
  journalEntrySchema,
  journalPhotoPageSchema,
  journalPhotoQuerySchema,
  journalQuerySchema,
  journalShareListSchema,
  journalShareSchema,
  savedJournalEntrySchema,
  updateJournalEntrySchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { forPatients, forProfessionals } from '../../plugins/account-type.ts'
import { currentUser } from '../../plugins/authentication.ts'
import type { JournalPhotoService } from './journal-photos.ts'
import type { JournalService } from './journal.service.ts'
import type { SharedJournalService } from './shared-journal.service.ts'

const byId = z.object({ id: z.uuid() })

const byPatient = z.object({ patientId: z.uuid() })

export function journalRoutes(
  journal: JournalService,
  shared: SharedJournalService,
  photos: JournalPhotoService,
): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/journal/photos',
      {
        config: forPatients,
        schema: {
          querystring: journalPhotoQuerySchema,
          response: { 200: journalPhotoPageSchema },
        },
      },
      (request) => photos.page(currentUser(request), request.query),
    )
    app.get(
      '/journal',
      {
        config: forPatients,
        schema: {
          querystring: journalQuerySchema,
          response: { 200: journalEntryPageSchema },
        },
      },
      (request) => journal.list(currentUser(request), request.query),
    )
    app.post(
      '/journal',
      { config: forPatients, schema: { response: { 201: journalEntrySchema } } },
      async (request, reply) => reply.status(201).send(await journal.create(currentUser(request))),
    )
    app.get(
      '/journal/shares',
      { config: forPatients, schema: { response: { 200: journalShareListSchema } } },
      (request) => journal.shares(currentUser(request)),
    )
    app.post(
      '/journal/shares',
      {
        config: forPatients,
        schema: { body: createJournalShareSchema, response: { 201: journalShareSchema } },
      },
      async (request, reply) =>
        reply.status(201).send(await journal.share(currentUser(request), request.body)),
    )
    app.post(
      '/journal/shares/:id/revoke',
      { config: forPatients, schema: { params: byId } },
      async (request, reply) => {
        await journal.revoke(currentUser(request), request.params.id)
        return reply.status(204).send()
      },
    )
    app.get(
      '/journal/shares/:id/access',
      { config: forPatients, schema: { params: byId, response: { 200: journalAccessListSchema } } },
      (request) => journal.access(currentUser(request), request.params.id),
    )
    app.get(
      '/journal/:id',
      { config: forPatients, schema: { params: byId, response: { 200: journalEntrySchema } } },
      (request) => journal.get(currentUser(request), request.params.id),
    )
    app.put(
      '/journal/:id',
      {
        config: forPatients,
        bodyLimit: 1_048_576,
        schema: {
          params: byId,
          body: updateJournalEntrySchema,
          response: { 200: savedJournalEntrySchema },
        },
      },
      (request) => journal.update(currentUser(request), request.params.id, request.body),
    )
    app.delete(
      '/journal/:id',
      { config: forPatients, schema: { params: byId } },
      async (request, reply) => {
        await journal.remove(currentUser(request), request.params.id)
        return reply.status(204).send()
      },
    )
    app.get(
      '/professional/patients/:patientId/journal',
      {
        config: forProfessionals,
        schema: {
          params: byPatient,
          querystring: journalQuerySchema,
          response: { 200: journalEntryPageSchema },
        },
      },
      (request) => shared.list(currentUser(request), request.params.patientId, request.query),
    )
    app.get(
      '/professional/patients/:patientId/journal/:id',
      {
        config: forProfessionals,
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
