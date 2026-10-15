import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { allowedOrigin, buildTestApp } from '../support/test-app.ts'

describe('GET /health', () => {
  let app: App
  let connection: DatabaseConnection

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    await connection.close()
  })

  it('reports the service as healthy', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })

  it('sends security headers', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(response.headers['x-powered-by']).toBeUndefined()
  })

  it('allows cross origin requests from configured origins', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: allowedOrigin },
    })

    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin)
  })

  it('does not allow cross origin requests from other origins', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://evil.example.com' },
    })

    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  })
})
