import {
  createMemorySchema,
  memoryListSchema,
  memorySchema,
  updateMemorySchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { forPatients } from '../../plugins/account-type.ts'
import { currentUser } from '../../plugins/authentication.ts'
import type { MemoryService } from './memory.service.ts'

const byId = z.object({ id: z.uuid() })

export function memoryRoutes(service: MemoryService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/memories',
      { config: forPatients, schema: { response: { 200: memoryListSchema } } },
      (request) => service.list(currentUser(request)),
    )
    app.post(
      '/memories',
      {
        config: forPatients,
        schema: { body: createMemorySchema, response: { 201: memorySchema } },
      },
      async (request, reply) =>
        reply.status(201).send(await service.create(currentUser(request), request.body)),
    )
    app.patch(
      '/memories/:id',
      {
        config: forPatients,
        schema: { params: byId, body: updateMemorySchema, response: { 200: memorySchema } },
      },
      (request) => service.update(currentUser(request), request.params.id, request.body),
    )
    app.delete(
      '/memories/:id',
      { config: forPatients, schema: { params: byId } },
      async (request, reply) => {
        await service.remove(currentUser(request), request.params.id)
        return reply.status(204).send()
      },
    )
    app.delete('/memories', { config: forPatients }, async (request, reply) => {
      await service.removeAll(currentUser(request))
      return reply.status(204).send()
    })
    done()
  }
}
