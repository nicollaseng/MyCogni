import type { CreateMemoryInput, Memory, UpdateMemoryInput } from '@mycogni/contracts'
import { memoryLimits } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { NotFoundError } from '../../shared/errors.ts'
import type { MemoryRecord, MemoryRepository } from './memory.repository.ts'

export interface MemoryService {
  list(user: AuthenticatedUser): Promise<Memory[]>
  create(user: AuthenticatedUser, input: CreateMemoryInput): Promise<Memory>
  update(user: AuthenticatedUser, id: string, input: UpdateMemoryInput): Promise<Memory>
  remove(user: AuthenticatedUser, id: string): Promise<void>
  removeAll(user: AuthenticatedUser): Promise<void>
}

export function toMemory(record: MemoryRecord): Memory {
  return {
    id: record.id,
    content: record.content,
    kind: record.kind,
    origin: record.origin,
    importance: record.importance,
    status: record.status,
    sources: record.sources.map((source) => ({
      kind: source.kind,
      at: source.at.toISOString(),
    })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export function createMemoryService(repository: MemoryRepository): MemoryService {
  return {
    async list(user) {
      return (await repository.list(user.id)).map(toMemory)
    },
    async create(user, input) {
      return toMemory(
        await repository.create(user.id, {
          content: input.content,
          kind: input.kind ?? memoryLimits.defaultKind,
          importance: memoryLimits.manualImportance,
        }),
      )
    },
    async update(user, id, input) {
      const record = await repository.update(user.id, id, {
        ...(input.content === undefined ? {} : { content: input.content }),
        ...(input.kind === undefined ? {} : { kind: input.kind }),
      })
      if (record === undefined) {
        throw new NotFoundError('Memory not found')
      }
      return toMemory(record)
    },
    async remove(user, id) {
      if (!(await repository.remove(user.id, id))) {
        throw new NotFoundError('Memory not found')
      }
    },
    async removeAll(user) {
      await repository.removeAll(user.id)
    },
  }
}
