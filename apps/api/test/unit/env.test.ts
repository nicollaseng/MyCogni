import { describe, expect, it } from '@jest/globals'
import { InvalidConfigError, loadConfig } from '../../src/config/env.ts'

describe('loadConfig', () => {
  it('applies defaults when variables are missing', () => {
    expect(loadConfig({})).toEqual({
      nodeEnv: 'development',
      host: '0.0.0.0',
      port: 3333,
      logLevel: 'info',
      corsOrigins: [],
    })
  })

  it('parses the port and the comma separated list of origins', () => {
    const config = loadConfig({
      PORT: '8080',
      CORS_ORIGINS: 'http://localhost:3000, https://app.mycogni.com ,',
    })

    expect(config.port).toBe(8080)
    expect(config.corsOrigins).toEqual(['http://localhost:3000', 'https://app.mycogni.com'])
  })

  it('rejects a port that is not a valid number', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(InvalidConfigError)
  })

  it('rejects an origin that is not a valid URL', () => {
    expect(() => loadConfig({ CORS_ORIGINS: 'not-a-url' })).toThrow(InvalidConfigError)
  })

  it('rejects an unknown environment', () => {
    expect(() => loadConfig({ NODE_ENV: 'staging' })).toThrow(InvalidConfigError)
  })
})
