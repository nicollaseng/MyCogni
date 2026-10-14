import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { z } from 'zod'
import { ConflictError, NotFoundError } from '../../src/shared/errors.ts'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { buildTestApp } from '../support/test-app.ts'

describe('error handling', () => {
  let app: App
  let connection: DatabaseConnection

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db })
    app.get('/test/not-found', () => {
      throw new NotFoundError('Check-in not found')
    })
    app.get('/test/conflict', () => {
      throw new ConflictError('Email already registered')
    })
    app.get('/test/unexpected', () => {
      throw new Error('database password is hunter2')
    })
    app.post(
      '/test/validation',
      { schema: { body: z.object({ name: z.string().min(1), age: z.number().int() }) } },
      () => ({ ok: true }),
    )
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    await connection.close()
  })

  it('answers unknown routes with 404', async () => {
    const response = await app.inject({ method: 'GET', url: '/does-not-exist' })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      code: 'ROUTE_NOT_FOUND',
      message: 'Route GET /does-not-exist not found',
    })
  })

  it('maps domain errors to their status and code', async () => {
    const notFound = await app.inject({ method: 'GET', url: '/test/not-found' })
    const conflict = await app.inject({ method: 'GET', url: '/test/conflict' })

    expect(notFound.statusCode).toBe(404)
    expect(notFound.json()).toEqual({ code: 'NOT_FOUND', message: 'Check-in not found' })
    expect(conflict.statusCode).toBe(409)
    expect(conflict.json()).toEqual({ code: 'CONFLICT', message: 'Email already registered' })
  })

  it('reports every invalid field of the request body', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/test/validation',
      payload: { name: '', age: 1.5 },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      issues: [
        expect.objectContaining({ location: 'body', path: '/name' }),
        expect.objectContaining({ location: 'body', path: '/age' }),
      ],
    })
  })

  it('rejects a malformed JSON body as a bad request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/test/validation',
      headers: { 'content-type': 'application/json' },
      payload: '{"name":',
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'BAD_REQUEST' }))
  })

  it('hides the details of unexpected errors', async () => {
    const response = await app.inject({ method: 'GET', url: '/test/unexpected' })

    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({ code: 'INTERNAL_ERROR', message: 'Internal server error' })
    expect(response.body).not.toContain('hunter2')
  })
})
