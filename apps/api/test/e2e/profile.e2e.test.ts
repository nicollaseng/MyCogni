import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { randomUUID } from 'node:crypto'
import { avatarBucket } from '@mycogni/domain'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { downloadAs, tinyPdf, tinyPng, uploadAs, uploadAvatar } from '../support/storage.ts'
import {
  bearer,
  createTestUser,
  deleteTestUser,
  testSupabaseUrl,
  type TestUser,
} from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

describe('/v1/me', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser
  let carla: TestUser
  let dora: TestUser

  async function storageDelete(user: TestUser, path: string): Promise<unknown> {
    const response = await fetch(`${testSupabaseUrl}/storage/v1/object/${avatarBucket}`, {
      method: 'DELETE',
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY ?? '',
        authorization: `Bearer ${user.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ prefixes: [path] }),
    })
    return response.json()
  }

  function savePhoto(user: TestUser, avatarPath: string | null) {
    return app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(user),
      payload: { avatarPath },
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser({ full_name: 'Ana Lima' })
    bruno = await createTestUser({ name: 'Bruno' })
    carla = await createTestUser({ name: 'Carla', locale: 'pt-PT' })
    dora = await createTestUser()
  })

  afterAll(async () => {
    await deleteTestUser(ana.id)
    await deleteTestUser(bruno.id)
    await deleteTestUser(carla.id)
    await deleteTestUser(dora.id)
    await app.close()
    await connection.close()
  })

  it('refuses requests without a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/me' })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ code: 'UNAUTHORIZED', message: 'Authentication required' })
  })

  it('refuses a session that is not valid', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: { authorization: 'Bearer forged.token.value' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired session',
    })
  })

  it('returns the profile created when the person signed up', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/me', headers: bearer(ana) })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      id: ana.id,
      email: ana.email,
      accountType: 'patient',
      displayName: 'Ana Lima',
      avatarPath: null,
      timezone: 'America/Sao_Paulo',
      locale: null,
      journalInInsights: false,
      memoriesEnabled: true,
      termsOutdated: false,
      onboardingCompletedAt: null,
    })
  })

  it('keeps the language chosen when the person signed up', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/me', headers: bearer(carla) })

    expect(response.json()).toEqual(expect.objectContaining({ locale: 'pt-PT' }))
  })

  it('changes the language of the account', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(bruno),
      payload: { locale: 'en-GB' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.objectContaining({ locale: 'en-GB' }))
  })

  it('rejects a language the app does not speak', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(bruno),
      payload: { locale: 'fr-FR' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('updates the name and the time zone', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(ana),
      payload: { displayName: '  Ana  ', timezone: 'America/Manaus' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(
      expect.objectContaining({ displayName: 'Ana', timezone: 'America/Manaus' }),
    )
  })

  it('rejects a time zone that does not exist', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(ana),
      payload: { timezone: 'Mars/Olympus' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })

  it('turns MyBook on and off for the summaries', async () => {
    const on = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(carla),
      payload: { journalInInsights: true },
    })
    const saved = await app.inject({ method: 'GET', url: '/v1/me', headers: bearer(carla) })
    const others = await app.inject({ method: 'GET', url: '/v1/me', headers: bearer(bruno) })
    const off = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(carla),
      payload: { journalInInsights: false },
    })

    expect(on.statusCode).toBe(200)
    expect(on.json()).toEqual(expect.objectContaining({ journalInInsights: true }))
    expect(saved.json()).toEqual(expect.objectContaining({ journalInInsights: true }))
    expect(others.json()).toEqual(expect.objectContaining({ journalInInsights: false }))
    expect(off.json()).toEqual(expect.objectContaining({ journalInInsights: false }))
  })

  it('turns the memories off and on again', async () => {
    const off = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(carla),
      payload: { memoriesEnabled: false },
    })
    const others = await app.inject({ method: 'GET', url: '/v1/me', headers: bearer(bruno) })
    const on = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(carla),
      payload: { memoriesEnabled: true },
    })

    expect(off.json()).toEqual(expect.objectContaining({ memoriesEnabled: false }))
    expect(others.json()).toEqual(expect.objectContaining({ memoriesEnabled: true }))
    expect(on.json()).toEqual(expect.objectContaining({ memoriesEnabled: true }))
  })

  it('rejects a MyBook choice that is not on or off', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(carla),
      payload: { journalInInsights: 'sim' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })

  it('keeps each person to their own profile', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/me', headers: bearer(bruno) })

    expect(response.json()).toEqual(
      expect.objectContaining({
        id: bruno.id,
        displayName: 'Bruno',
        timezone: 'America/Sao_Paulo',
      }),
    )
  })

  it('keeps the photo inside the person own folder', async () => {
    const path = await uploadAvatar(ana)
    const own = await savePhoto(ana, path)
    const foreign = await savePhoto(ana, `${bruno.id}/avatar-1.png`)
    const cleared = await savePhoto(ana, null)

    expect(own.json()).toEqual(expect.objectContaining({ avatarPath: path }))
    expect(foreign.statusCode).toBe(422)
    expect(cleared.json()).toEqual(expect.objectContaining({ avatarPath: null }))
  })

  it('keeps only photos that were really uploaded and really are images', async () => {
    const missing = await savePhoto(bruno, `${bruno.id}/${randomUUID()}.png`)
    const disguised = `${bruno.id}/${randomUUID()}.png`
    await uploadAs(bruno, avatarBucket, disguised, 'image/png', tinyPdf)
    const renamed = `${bruno.id}/${randomUUID()}.jpg`
    await uploadAs(bruno, avatarBucket, renamed, 'image/jpeg', tinyPng)

    const fake = await savePhoto(bruno, disguised)
    const mismatched = await savePhoto(bruno, renamed)

    expect(missing.statusCode).toBe(422)
    expect(fake.statusCode).toBe(415)
    expect(fake.json()).toEqual(expect.objectContaining({ code: 'UNSUPPORTED_TYPE' }))
    expect(mismatched.statusCode).toBe(415)
  })

  it('locks the photo of a verified professional, who changes it through support', async () => {
    const first = await uploadAvatar(dora)
    await savePhoto(dora, first)
    await registerProfessional(connection.db, dora.id)
    const second = await uploadAvatar(dora)

    const changed = await savePhoto(dora, second)
    const removed = await savePhoto(dora, null)
    const renamed = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(dora),
      payload: { displayName: 'Dora' },
    })

    expect(changed.statusCode).toBe(409)
    expect(changed.json()).toEqual(expect.objectContaining({ code: 'IDENTITY_LOCKED' }))
    expect(removed.statusCode).toBe(409)
    expect(await storageDelete(dora, first)).toEqual([])
    expect((await uploadAs(dora, avatarBucket, first, 'image/png', tinyPdf, true)).ok).toBe(false)
    expect((await downloadAs(dora, avatarBucket, first)).status).toBe(200)
    expect(renamed.json()).toEqual(
      expect.objectContaining({ avatarPath: first, displayName: 'Dora' }),
    )
  })
})
