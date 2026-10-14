import { profileSchema, updateProfileSchema } from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { ProfileService } from './profile.service.ts'

export function profileRoutes(service: ProfileService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get('/me', { schema: { response: { 200: profileSchema } } }, (request) =>
      service.get(currentUser(request)),
    )
    app.patch(
      '/me',
      { schema: { body: updateProfileSchema, response: { 200: profileSchema } } },
      (request) => service.update(currentUser(request), request.body),
    )
    done()
  }
}
