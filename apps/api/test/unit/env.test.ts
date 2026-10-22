import { describe, expect, it } from '@jest/globals'
import { InvalidConfigError, loadConfig } from '../../src/config/env.ts'

const required = {
  DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:55322/postgres',
  SUPABASE_URL: 'http://127.0.0.1:55321',
  SUPABASE_SECRET_KEY: 'sb_secret_test',
  WEB_URL: 'http://localhost:3000/',
}

describe('loadConfig', () => {
  it('applies defaults when optional variables are missing', () => {
    expect(loadConfig(required)).toEqual({
      nodeEnv: 'development',
      host: '0.0.0.0',
      port: 3333,
      logLevel: 'info',
      corsOrigins: [],
      databaseUrl: required.DATABASE_URL,
      supabaseUrl: required.SUPABASE_URL,
      supabaseSecretKey: required.SUPABASE_SECRET_KEY,
      webUrl: 'http://localhost:3000',
      mail: { provider: 'none' },
      supportEmail: 'support@mycogniapp.com',
      redisUrl: null,
      queuePrefix: 'bull',
      anthropicApiKey: null,
      assistantModel: 'claude',
      elevenLabsApiKey: null,
      zeroRetentionTranscription: false,
      push: null,
      reminderEveryMs: 300_000,
      questionnaireSweepEveryMs: 900_000,
    })
  })

  it('turns web push on only with both VAPID keys', () => {
    expect(loadConfig({ ...required, VAPID_PUBLIC_KEY: 'public' }).push).toBeNull()
    expect(
      loadConfig({ ...required, VAPID_PUBLIC_KEY: 'public', VAPID_PRIVATE_KEY: 'private' }).push,
    ).toEqual({
      publicKey: 'public',
      privateKey: 'private',
      subject: 'mailto:support@mycogniapp.com',
    })
    expect(() => loadConfig({ ...required, VAPID_SUBJECT: 'support@mycogniapp.com' })).toThrow(
      InvalidConfigError,
    )
  })

  it('allows the scripted assistant only outside production', () => {
    expect(loadConfig({ ...required, ASSISTANT_MODEL: 'scripted' }).assistantModel).toBe('scripted')
    expect(() =>
      loadConfig({ ...required, NODE_ENV: 'production', ASSISTANT_MODEL: 'scripted' }),
    ).toThrow(InvalidConfigError)
  })

  it('namespaces the job queues when a prefix is given', () => {
    expect(loadConfig({ ...required, QUEUE_PREFIX: 'e2e-3336' }).queuePrefix).toBe('e2e-3336')
    expect(() => loadConfig({ ...required, QUEUE_PREFIX: 'bad:prefix' })).toThrow(
      InvalidConfigError,
    )
  })

  it('sends email through Resend when there is a key, otherwise through Mailpit', () => {
    expect(
      loadConfig({ ...required, RESEND_API_KEY: 're_test', MAILPIT_URL: 'http://m' }).mail,
    ).toEqual({ provider: 'resend', apiKey: 're_test', from: 'MyCogniAI <onboarding@resend.dev>' })
    expect(
      loadConfig({
        ...required,
        MAILPIT_URL: 'http://127.0.0.1:55324/',
        MAIL_FROM: 'Cogni <a@b.co>',
      }).mail,
    ).toEqual({ provider: 'mailpit', url: 'http://127.0.0.1:55324', from: 'Cogni <a@b.co>' })
  })

  it('sends new tickets to the support inbox that is configured', () => {
    expect(loadConfig({ ...required, SUPPORT_EMAIL: 'ajuda@mycogniapp.com' }).supportEmail).toBe(
      'ajuda@mycogniapp.com',
    )
    expect(() => loadConfig({ ...required, SUPPORT_EMAIL: 'support' })).toThrow(InvalidConfigError)
  })

  it('parses the port and the comma separated list of origins', () => {
    const config = loadConfig({
      ...required,
      PORT: '8080',
      CORS_ORIGINS: 'http://localhost:3000, https://app.mycogni.com ,',
    })

    expect(config.port).toBe(8080)
    expect(config.corsOrigins).toEqual(['http://localhost:3000', 'https://app.mycogni.com'])
  })

  it('drops a trailing slash from the Supabase address', () => {
    expect(loadConfig({ ...required, SUPABASE_URL: 'https://abc.supabase.co/' }).supabaseUrl).toBe(
      'https://abc.supabase.co',
    )
  })

  it('requires the database and the Supabase addresses', () => {
    expect(() => loadConfig({})).toThrow(InvalidConfigError)
    expect(() => loadConfig({ DATABASE_URL: required.DATABASE_URL })).toThrow(InvalidConfigError)
  })

  it('rejects a database address that is not Postgres', () => {
    expect(() => loadConfig({ ...required, DATABASE_URL: 'mysql://localhost/db' })).toThrow(
      InvalidConfigError,
    )
  })

  it('rejects a port that is not a valid number', () => {
    expect(() => loadConfig({ ...required, PORT: 'abc' })).toThrow(InvalidConfigError)
  })

  it('rejects an origin that is not a valid URL', () => {
    expect(() => loadConfig({ ...required, CORS_ORIGINS: 'not-a-url' })).toThrow(InvalidConfigError)
  })

  it('rejects an unknown environment', () => {
    expect(() => loadConfig({ ...required, NODE_ENV: 'staging' })).toThrow(InvalidConfigError)
  })
})
