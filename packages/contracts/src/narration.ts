import type { NarrationManifest } from '@mycogni/domain'
import { z } from 'zod'

const narrationFileSchema = z.object({
  path: z.string().regex(/^(pt-BR|pt-PT|en)\/[a-z]+\/[a-z0-9-]+-[0-9a-f]{16}\.mp3$/),
  bytes: z.number().int().positive(),
})

export const narrationManifestSchema: z.ZodType<NarrationManifest> = z.object({
  version: z.literal(1),
  files: z.record(z.string().regex(/^[0-9a-f]{16}$/), narrationFileSchema),
})
