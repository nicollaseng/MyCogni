import type {
  CreateJournalShareInput,
  JournalAccess,
  JournalEntry,
  JournalEntrySummary,
  JournalQuery,
  JournalShare,
  SavedJournalEntry,
  UpdateJournalEntryInput,
} from '@mycogni/contracts'
import { isOwnJournalPath, raisedRisk } from '@mycogni/domain'
import type { FastifyBaseLogger } from 'fastify'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { NotFoundError, UnprocessableError } from '../../shared/errors.ts'
import type { JournalImageStore } from '../../storage/journal-images.ts'
import type { NoteSafety } from '../safety/note-safety.ts'
import { toEntry, toShare, toSummary } from './journal.mapper.ts'
import { UnknownJournalEntryError, type JournalRepository } from './journal.repository.ts'

export interface JournalService {
  list(user: AuthenticatedUser, query: JournalQuery): Promise<JournalEntrySummary[]>
  create(user: AuthenticatedUser): Promise<JournalEntry>
  get(user: AuthenticatedUser, id: string): Promise<JournalEntry>
  update(
    user: AuthenticatedUser,
    id: string,
    input: UpdateJournalEntryInput,
  ): Promise<SavedJournalEntry>
  remove(user: AuthenticatedUser, id: string): Promise<void>
  shares(user: AuthenticatedUser): Promise<JournalShare[]>
  share(user: AuthenticatedUser, input: CreateJournalShareInput): Promise<JournalShare>
  revoke(user: AuthenticatedUser, shareId: string): Promise<void>
  access(user: AuthenticatedUser, shareId: string): Promise<JournalAccess[]>
}

export interface JournalDependencies {
  journal: JournalRepository
  images: JournalImageStore
  safety: NoteSafety
  log: Pick<FastifyBaseLogger, 'error'>
  now: () => Date
}

export function createJournalService({
  journal,
  images,
  safety,
  log,
  now,
}: JournalDependencies): JournalService {
  async function forget(paths: string[]): Promise<void> {
    try {
      await images.remove(paths)
    } catch (error) {
      log.error({ err: error }, 'Journal images were not removed')
    }
  }

  return {
    async list(user, query) {
      const records = await journal.list(user.id, user.id, {
        q: query.q,
        before: query.before === undefined ? undefined : new Date(query.before),
        limit: query.limit,
      })
      return records.map(toSummary)
    },
    async create(user) {
      return toEntry(await journal.create(user.id), images)
    },
    async get(user, id) {
      const record = await journal.find(user.id, id)
      if (record?.userId !== user.id) {
        throw new NotFoundError('Journal entry not found')
      }
      return toEntry(record, images)
    },
    async update(user, id, input) {
      if (!input.imagePaths.every((path) => isOwnJournalPath(path, user.id, id))) {
        throw new UnprocessableError('Images must be stored in the folder of this entry')
      }
      const outcome = await journal.update(user.id, id, {
        title: input.title === '' ? null : input.title,
        body: input.body,
        plainText: input.plainText,
        imagePaths: [...new Set(input.imagePaths)],
      })
      if (outcome.kind === 'not_found') {
        throw new NotFoundError('Journal entry not found')
      }
      await forget(outcome.removedImages)
      const support = await safety.review(
        { kind: 'journal', patientId: user.id, entryId: id },
        raisedRisk(outcome.previousText, outcome.entry.plainText),
      )
      return { ...(await toEntry(outcome.entry, images)), support }
    },
    async remove(user, id) {
      const paths = await journal.delete(user.id, id)
      if (paths === null) {
        throw new NotFoundError('Journal entry not found')
      }
      await forget(paths)
    },
    async shares(user) {
      const moment = now()
      return (await journal.listShares(user.id)).map((record) => toShare(record, moment))
    },
    async share(user, input) {
      try {
        const id = await journal.createShare(user.id, {
          careLinkId: input.careLinkId,
          scope: input.scope,
          entryIds: input.scope === 'entries' ? input.entryIds : [],
          expiresAt: input.expiresAt === null ? null : new Date(input.expiresAt),
        })
        if (id === null) {
          throw new NotFoundError('No active link with this professional')
        }
        const created = (await journal.listShares(user.id)).find((record) => record.id === id)
        if (created === undefined) {
          throw new NotFoundError('Journal share not found')
        }
        return toShare(created, now())
      } catch (error) {
        if (error instanceof UnknownJournalEntryError) {
          throw new UnprocessableError('Only your own entries can be shared')
        }
        throw error
      }
    },
    async revoke(user, shareId) {
      if (!(await journal.revokeShare(user.id, shareId))) {
        throw new NotFoundError('No active share with this id')
      }
    },
    async access(user, shareId) {
      const records = await journal.accessLog(user.id, shareId)
      return records.map((record) => ({ ...record, accessedAt: record.accessedAt.toISOString() }))
    },
  }
}
