import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { consentVersion, legalVersion } from '@mycogni/domain'
import { and, eq, inArray } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { consents } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

interface ConsentBody {
  kind: string
  version: string
  grantedAt: string
}

describe('/v1/consents', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser

  function grant(user: TestUser, kinds: string[]) {
    return app.inject({
      method: 'POST',
      url: '/v1/consents',
      headers: bearer(user),
      payload: { kinds },
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser()
    bruno = await createTestUser()
  })

  afterAll(async () => {
    await deleteTestUser(ana.id)
    await deleteTestUser(bruno.id)
    await app.close()
    await connection.close()
  })

  it('refuses requests without a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/consents' })

    expect(response.statusCode).toBe(401)
  })

  it('starts with nothing granted', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/consents', headers: bearer(ana) })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })

  it('records each consent once, against the current version of the documents', async () => {
    const response = await grant(ana, ['terms', 'privacy', 'health_data', 'adult', 'terms'])

    expect(response.statusCode).toBe(201)
    expect(response.json<ConsentBody[]>()).toEqual([
      { kind: 'terms', version: legalVersion, grantedAt: expect.any(String) },
      { kind: 'privacy', version: legalVersion, grantedAt: expect.any(String) },
      { kind: 'health_data', version: '2026-10', grantedAt: expect.any(String) },
      { kind: 'adult', version: '2026-10', grantedAt: expect.any(String) },
    ])
  })

  it('keeps the original date when a consent is given again', async () => {
    const before = await app.inject({ method: 'GET', url: '/v1/consents', headers: bearer(ana) })
    const termsBefore = before.json<ConsentBody[]>().find((consent) => consent.kind === 'terms')

    const response = await grant(ana, ['terms', 'ai_processing'])
    const consents = response.json<ConsentBody[]>()

    expect(consents.map((consent) => consent.kind)).toEqual([
      'terms',
      'privacy',
      'health_data',
      'adult',
      'ai_processing',
    ])
    expect(consents.find((consent) => consent.kind === 'terms')).toEqual(termsBefore)
  })

  it('rejects a consent that does not exist', async () => {
    const response = await grant(ana, ['marketing'])

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })

  it('rejects an empty grant', async () => {
    const response = await grant(ana, [])

    expect(response.statusCode).toBe(400)
  })

  it('keeps each person to their own consents', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/consents',
      headers: bearer(bruno),
    })

    expect(response.json()).toEqual([])
  })

  it('withdraws the optional AI consent and grants it again later', async () => {
    const revoked = await app.inject({
      method: 'DELETE',
      url: '/v1/consents/ai_processing',
      headers: bearer(ana),
    })
    const afterRevoke = await app.inject({
      method: 'GET',
      url: '/v1/consents',
      headers: bearer(ana),
    })
    await grant(ana, ['ai_processing'])
    const afterGrant = await app.inject({
      method: 'GET',
      url: '/v1/consents',
      headers: bearer(ana),
    })

    expect(revoked.statusCode).toBe(204)
    expect(afterRevoke.json<ConsentBody[]>().map((consent) => consent.kind)).not.toContain(
      'ai_processing',
    )
    expect(afterGrant.json<ConsentBody[]>().map((consent) => consent.kind)).toContain(
      'ai_processing',
    )
  })

  it('keeps required consents unless the account is deleted', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/v1/consents/health_data',
      headers: bearer(ana),
    })

    expect(response.statusCode).toBe(422)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'UNPROCESSABLE_ENTITY' }))
  })

  it('rejects withdrawing a consent that does not exist', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/v1/consents/marketing',
      headers: bearer(ana),
    })

    expect(response.statusCode).toBe(400)
  })

  it('keeps withdrawn consents in the export with the date they were withdrawn', async () => {
    await app.inject({ method: 'DELETE', url: '/v1/consents/ai_processing', headers: bearer(ana) })
    const response = await app.inject({ method: 'GET', url: '/v1/me/export', headers: bearer(ana) })
    const consents = response.json<{ consents: { kind: string; revokedAt: string | null }[] }>()
      .consents

    expect(consents.find((consent) => consent.kind === 'ai_processing')?.revokedAt).toEqual(
      expect.any(String),
    )
    expect(consents.find((consent) => consent.kind === 'terms')?.revokedAt).toBeNull()
  })

  it('asks again for the terms after they change and keeps the other permissions', async () => {
    const carla = await createTestUser()
    try {
      await grant(carla, ['terms', 'privacy', 'health_data', 'adult', 'assistant_data'])
      await connection.db
        .update(consents)
        .set({ version: consentVersion })
        .where(and(eq(consents.userId, carla.id), inArray(consents.kind, ['terms', 'privacy'])))
      const me = () => app.inject({ method: 'GET', url: '/v1/me', headers: bearer(carla) })

      expect((await me()).json()).toEqual(expect.objectContaining({ termsOutdated: true }))
      const current = await app.inject({
        method: 'GET',
        url: '/v1/consents',
        headers: bearer(carla),
      })
      expect(current.json<ConsentBody[]>().map((consent) => consent.kind)).toEqual([
        'health_data',
        'adult',
        'assistant_data',
      ])

      await grant(carla, ['terms', 'privacy'])
      expect((await me()).json()).toEqual(expect.objectContaining({ termsOutdated: false }))
    } finally {
      await deleteTestUser(carla.id)
    }
  })

  it('does not ask a person who never accepted the terms', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/me', headers: bearer(bruno) })

    expect(response.json()).toEqual(expect.objectContaining({ termsOutdated: false }))
  })
})
