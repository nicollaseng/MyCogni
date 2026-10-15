import { z } from 'zod'

const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  LOG_LEVEL: z.enum(logLevels).default('info'),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    )
    .pipe(z.array(z.url())),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  SUPABASE_URL: z.url({ protocol: /^https?$/ }).transform((value) => value.replace(/\/+$/, '')),
})

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production'
  host: string
  port: number
  logLevel: (typeof logLevels)[number]
  corsOrigins: string[]
  databaseUrl: string
  supabaseUrl: string
}

export class InvalidConfigError extends Error {
  constructor(details: string) {
    super(`Invalid environment configuration:\n${details}`)
    this.name = 'InvalidConfigError'
  }
}

export function loadConfig(source: Record<string, string | undefined>): AppConfig {
  const parsed = envSchema.safeParse(source)
  if (!parsed.success) {
    throw new InvalidConfigError(z.prettifyError(parsed.error))
  }
  const env = parsed.data
  return {
    nodeEnv: env.NODE_ENV,
    host: env.HOST,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    corsOrigins: env.CORS_ORIGINS,
    databaseUrl: env.DATABASE_URL,
    supabaseUrl: env.SUPABASE_URL,
  }
}
