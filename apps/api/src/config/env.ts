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
  ELEVENLABS_API_KEY: z.string().min(1).optional(),
  ELEVENLABS_ZERO_RETENTION: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  VAPID_SUBJECT: z
    .string()
    .regex(/^(mailto:|https:)/)
    .default('mailto:support@mycogniapp.com'),
  REMINDER_EVERY_MS: z.coerce.number().int().min(1_000).default(300_000),
  QUESTIONNAIRE_SWEEP_EVERY_MS: z.coerce.number().int().min(1_000).default(900_000),
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
  elevenLabsApiKey: string | null
  zeroRetentionTranscription: boolean
  push: PushConfig | null
  reminderEveryMs: number
  questionnaireSweepEveryMs: number
}

export interface PushConfig {
  publicKey: string
  privateKey: string
  subject: string
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
    elevenLabsApiKey: env.ELEVENLABS_API_KEY ?? null,
    zeroRetentionTranscription: env.ELEVENLABS_ZERO_RETENTION,
    push:
      env.VAPID_PUBLIC_KEY === undefined || env.VAPID_PRIVATE_KEY === undefined
        ? null
        : {
            publicKey: env.VAPID_PUBLIC_KEY,
            privateKey: env.VAPID_PRIVATE_KEY,
            subject: env.VAPID_SUBJECT,
          },
    reminderEveryMs: env.REMINDER_EVERY_MS,
    questionnaireSweepEveryMs: env.QUESTIONNAIRE_SWEEP_EVERY_MS,
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
