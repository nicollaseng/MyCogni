import { patientInsightListSchema, professionalInsightListSchema } from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { Database } from '../../db/client.ts'
import { forPatients, forProfessionals } from '../../plugins/account-type.ts'
import { currentUser } from '../../plugins/authentication.ts'
import { createCareLinkRepository } from '../care-links/care-link.repository.ts'
import { createProfessionalRepository } from '../professionals/professional.repository.ts'
import { createInsightRepository } from './insight.repository.ts'
import { createInsightService } from './insight.service.ts'

export function insightModule(db: Database): FastifyPluginCallbackZod {
  const service = createInsightService({
    insights: createInsightRepository(db),
    careLinks: createCareLinkRepository(db),
    professionals: createProfessionalRepository(db),
  })
  return (app, _options, done) => {
    app.get(
      '/insights',
      { config: forPatients, schema: { response: { 200: patientInsightListSchema } } },
      (request) => service.mine(currentUser(request)),
    )
    app.get(
      '/professional/patients/:patientId/insights',
      {
        config: forProfessionals,
        schema: {
          params: z.object({ patientId: z.uuid() }),
          response: { 200: professionalInsightListSchema },
        },
      },
      (request) => service.ofPatient(currentUser(request), request.params.patientId),
    )
    done()
  }
}
