import type { JournalEntry, JournalEntryPage, JournalQuery } from '@mycogni/contracts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { ForbiddenError, NotFoundError } from '../../shared/errors.ts'
import type { JournalImageStore } from '../../storage/journal-images.ts'
import type { CareLinkRepository } from '../care-links/care-link.repository.ts'
import type { ProfessionalRepository } from '../professionals/professional.repository.ts'
import { toEntry, toSummaryPage } from './journal.mapper.ts'
import type { JournalRepository } from './journal.repository.ts'

export interface SharedJournalService {
  list(user: AuthenticatedUser, patientId: string, query: JournalQuery): Promise<JournalEntryPage>
  get(user: AuthenticatedUser, patientId: string, entryId: string): Promise<JournalEntry>
}

export interface SharedJournalDependencies {
  journal: JournalRepository
  careLinks: CareLinkRepository
  professionals: ProfessionalRepository
  images: JournalImageStore
}

export function createSharedJournalService({
  journal,
  careLinks,
  professionals,
  images,
}: SharedJournalDependencies): SharedJournalService {
  async function requireLinked(user: AuthenticatedUser, patientId: string): Promise<void> {
    const professional = await professionals.find(user.id)
    if (professional?.status !== 'verified') {
      throw new ForbiddenError('Only verified professionals can read shared journals')
    }
    const linked = (await careLinks.listPatients(user.id)).some(
      (link) => link.patientId === patientId,
    )
    if (!linked) {
      throw new NotFoundError('Patient not found')
    }
  }

  return {
    async list(user, patientId, query) {
      await requireLinked(user, patientId)
      return toSummaryPage(await journal.page(user.id, patientId, query), query.size)
    },
    async get(user, patientId, entryId) {
      await requireLinked(user, patientId)
      const record = await journal.find(user.id, entryId)
      if (record?.userId !== patientId) {
        throw new NotFoundError('Journal entry not found')
      }
      await journal.recordAccess(user.id, patientId, entryId)
      return toEntry(record, images)
    },
  }
}
