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
  SUPABASE_SECRET_KEY: z.string().min(1),
  WEB_URL: z.url({ protocol: /^https?$/ }).transform((value) => value.replace(/\/+$/, '')),
  RESEND_API_KEY: z.string().min(1).optional(),
  MAILPIT_URL: z
    .url({ protocol: /^https?$/ })
    .transform((value) => value.replace(/\/+$/, ''))
    .optional(),
  MAIL_FROM: z.string().min(3).default('MyCogniAI <onboarding@resend.dev>'),
  SUPPORT_EMAIL: z.email().default('support@mycogniapp.com'),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }).optional(),
  QUEUE_PREFIX: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .default('bull'),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ASSISTANT_MODEL: z.enum(['claude', 'scripted']).default('claude'),
})

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production'
  host: string
  port: number
  logLevel: (typeof logLevels)[number]
  corsOrigins: string[]
  databaseUrl: string
  supabaseUrl: string
  supabaseSecretKey: string
  webUrl: string
  mail: MailConfig
  supportEmail: string
  redisUrl: string | null
  queuePrefix: string
  anthropicApiKey: string | null
  assistantModel: 'claude' | 'scripted'
}

export type MailConfig =
  | { provider: 'resend'; apiKey: string; from: string }
  | { provider: 'mailpit'; url: string; from: string }
  | { provider: 'none' }

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
  if (env.NODE_ENV === 'production' && env.ASSISTANT_MODEL === 'scripted') {
    throw new InvalidConfigError('ASSISTANT_MODEL=scripted is only allowed outside production')
  }
  return {
    nodeEnv: env.NODE_ENV,
    host: env.HOST,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    corsOrigins: env.CORS_ORIGINS,
    databaseUrl: env.DATABASE_URL,
    supabaseUrl: env.SUPABASE_URL,
    supabaseSecretKey: env.SUPABASE_SECRET_KEY,
    webUrl: env.WEB_URL,
    mail: mailConfig(env.RESEND_API_KEY, env.MAILPIT_URL, env.MAIL_FROM),
    supportEmail: env.SUPPORT_EMAIL,
    redisUrl: env.REDIS_URL ?? null,
    queuePrefix: env.QUEUE_PREFIX,
    anthropicApiKey: env.ANTHROPIC_API_KEY ?? null,
    assistantModel: env.ASSISTANT_MODEL,
  }
}

function mailConfig(
  resendApiKey: string | undefined,
  mailpitUrl: string | undefined,
  from: string,
): MailConfig {
  if (resendApiKey !== undefined) {
    return { provider: 'resend', apiKey: resendApiKey, from }
  }
  if (mailpitUrl !== undefined) {
    return { provider: 'mailpit', url: mailpitUrl, from }
  }
  return { provider: 'none' }
}
