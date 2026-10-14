import { z } from 'zod'
import { InvalidConfigError } from './env.ts'

const databaseEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
})

export function loadDatabaseUrl(source: Record<string, string | undefined>): string {
  const parsed = databaseEnvSchema.safeParse(source)
  if (!parsed.success) {
    throw new InvalidConfigError(z.prettifyError(parsed.error))
  }
  return parsed.data.DATABASE_URL
}
