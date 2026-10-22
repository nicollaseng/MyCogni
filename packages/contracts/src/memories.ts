import {
  memoryKinds,
  memoryLimits,
  memoryOrigins,
  memorySourceKinds,
  memoryStatuses,
  normalizeMemory,
} from '@mycogni/domain'
import { z } from 'zod'

const memoryContent = z
  .string()
  .transform(normalizeMemory)
  .pipe(z.string().min(1).max(memoryLimits.content))

export const memorySourceSchema = z.object({
  kind: z.enum(memorySourceKinds),
  at: z.iso.datetime({ offset: true }),
})

export type MemorySource = z.infer<typeof memorySourceSchema>

export const memorySchema = z.object({
  id: z.uuid(),
  content: z.string(),
  kind: z.enum(memoryKinds),
  origin: z.enum(memoryOrigins),
  importance: z.int().min(1).max(3),
  status: z.enum(memoryStatuses),
  sources: z.array(memorySourceSchema),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
})

export type Memory = z.infer<typeof memorySchema>

export const memoryListSchema = z.array(memorySchema)

export const createMemorySchema = z.object({
  content: memoryContent,
  kind: z.enum(memoryKinds).optional(),
})

export type CreateMemoryInput = z.infer<typeof createMemorySchema>

export const updateMemorySchema = z
  .object({
    content: memoryContent.optional(),
    kind: z.enum(memoryKinds).optional(),
  })
  .refine((input) => input.content !== undefined || input.kind !== undefined, {
    message: 'Send the content or the kind to change',
  })

export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>

export const memoryOperationsSchema = z.object({
  operations: z.array(
    z.discriminatedUnion('op', [
      z.object({
        op: z.literal('add'),
        content: z.string(),
        kind: z.enum(memoryKinds),
        importance: z.int(),
        sources: z.array(z.string()),
      }),
      z.object({
        op: z.literal('update'),
        id: z.string(),
        content: z.string(),
        importance: z.int(),
        sources: z.array(z.string()),
      }),
      z.object({ op: z.literal('archive'), id: z.string() }),
    ]),
  ),
})

export type MemoryOperations = z.infer<typeof memoryOperationsSchema>
