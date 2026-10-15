import {
  adoptAccountTypeSchema,
  profileSchema,
  providerPhotoImportSchema,
  updateProfileSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { ProfileService } from './profile.service.ts'
import type { ProviderPhotoImporter } from './provider-photo.service.ts'

export function profileRoutes(
  service: ProfileService,
  providerPhotos: ProviderPhotoImporter,
): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get('/me', { schema: { response: { 200: profileSchema } } }, (request) =>
      service.get(currentUser(request)),
    )
    app.patch(
      '/me',
      { schema: { body: updateProfileSchema, response: { 200: profileSchema } } },
      (request) => service.update(currentUser(request), request.body),
    )
    app.post(
      '/me/account-type',
      { schema: { body: adoptAccountTypeSchema, response: { 200: profileSchema } } },
      (request) => service.adoptProfessional(currentUser(request)),
    )
    app.post(
      '/me/photo/import',
      { schema: { response: { 200: providerPhotoImportSchema } } },
      (request) => providerPhotos.importFor(currentUser(request)),
    )
    done()
  }
}
