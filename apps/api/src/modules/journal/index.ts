import type { FastifyBaseLogger } from 'fastify'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import type { JournalImageStore } from '../../storage/journal-images.ts'
import { createCareLinkRepository } from '../care-links/care-link.repository.ts'
import { createProfessionalRepository } from '../professionals/professional.repository.ts'
import { createJournalRepository } from './journal.repository.ts'
import { journalRoutes } from './journal.routes.ts'
import { createJournalService } from './journal.service.ts'
import { createSharedJournalService } from './shared-journal.service.ts'

export interface JournalModuleOptions {
  db: Database
  images: JournalImageStore
  log: Pick<FastifyBaseLogger, 'error'>
}

export function journalModule({ db, images, log }: JournalModuleOptions): FastifyPluginCallbackZod {
  const journal = createJournalRepository(db)
  return journalRoutes(
    createJournalService({ journal, images, log, now: () => new Date() }),
    createSharedJournalService({
      journal,
      careLinks: createCareLinkRepository(db),
      professionals: createProfessionalRepository(db),
      images,
    }),
  )
}
