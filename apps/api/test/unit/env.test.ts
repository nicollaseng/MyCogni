import { describe, expect, it } from '@jest/globals'
import { InvalidConfigError, loadConfig } from '../../src/config/env.ts'

const required = {
  DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:55322/postgres',
  SUPABASE_URL: 'http://127.0.0.1:55321',
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
    })
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
