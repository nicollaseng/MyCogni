import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { createProfessionalRepository } from '../professionals/professional.repository.ts'
import { createAlertRepository } from './alert.repository.ts'
import { alertRoutes } from './alert.routes.ts'
import { createAlertService } from './alert.service.ts'

export function alertModule(db: Database): FastifyPluginCallbackZod {
  return alertRoutes(
    createAlertService({
      alerts: createAlertRepository(db),
      professionals: createProfessionalRepository(db),
    }),
  )
}
