import { profileSchema } from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { OnboardingService } from './onboarding.service.ts'

export function onboardingRoutes(service: OnboardingService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.post('/onboarding/complete', { schema: { response: { 200: profileSchema } } }, (request) =>
      service.complete(currentUser(request)),
    )
    done()
  }
}
