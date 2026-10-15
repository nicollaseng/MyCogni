import { randomInt } from 'node:crypto'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import type { Mailer } from '../../mail/mailer.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { createCareLinkRepository } from '../care-links/care-link.repository.ts'
import { createProfessionalRepository } from '../professionals/professional.repository.ts'
import { createInvitationRepository } from './invitation.repository.ts'
import { invitationPublicRoutes, invitationRoutes } from './invitation.routes.ts'
import { createInvitationService, type InvitationService } from './invitation.service.ts'

export interface InvitationModuleOptions {
  db: Database
  photos: BucketStore
  mailer: Mailer
  webUrl: string
}

function invitationService({
  db,
  photos,
  mailer,
  webUrl,
}: InvitationModuleOptions): InvitationService {
  return createInvitationService({
    invitations: createInvitationRepository(db),
    professionals: createProfessionalRepository(db),
    careLinks: createCareLinkRepository(db),
    photos,
    mailer,
    webUrl,
    pickIndex: (size) => randomInt(size),
    now: () => new Date(),
  })
}

export function invitationModule(options: InvitationModuleOptions): FastifyPluginCallbackZod {
  return invitationRoutes(invitationService(options))
}

export function invitationPublicModule(options: InvitationModuleOptions): FastifyPluginCallbackZod {
  return invitationPublicRoutes(invitationService(options))
}
