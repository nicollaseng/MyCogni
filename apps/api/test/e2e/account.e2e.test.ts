import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { avatarBucket, journalBucket, professionalDocumentBucket } from '@mycogni/domain'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import {
  storedFiles,
  uploadAvatar,
  uploadJournalImage,
  uploadProfessionalDocument,
} from '../support/storage.ts'
import {
  bearer,
  createTestUser,
  deleteTestUser,
  testSupabaseUrl,
  type TestUser,
} from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

interface ExportBody {
  profile: { id: string; displayName: string | null }
  consents: { kind: string }[]
  assessments: { instrument: string; answers: number[]; totalScore: number }[]
  checkIns: { note: string | null }[]
}

describe('/v1/me account', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser

  function post(user: TestUser, url: string, payload: Record<string, unknown>) {
    return app.inject({ method: 'POST', url, headers: bearer(user), payload })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser({ full_name: 'Ana' })
    bruno = await createTestUser({ full_name: 'Bruno' })
    await post(ana, '/v1/consents', { kinds: ['terms', 'privacy'] })
    await post(ana, '/v1/assessments', { instrument: 'gad7', answers: [1, 2, 0, 0, 1, 0, 0] })
    await post(ana, '/v1/check-ins', {
      moodLevel: 4,
      emotions: ['calma'],
      contexts: [],
      note: 'nota da Ana',
    })
    await post(bruno, '/v1/check-ins', {
      moodLevel: 2,
      emotions: [],
      contexts: [],
      note: 'nota do Bruno',
    })
  })

  afterAll(async () => {
    await deleteTestUser(bruno.id)
    await app.close()
    await connection.close()
  })

  it('exports everything the person recorded, including the answers', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/me/export',
      headers: bearer(ana),
    })
    const body = response.json<ExportBody>()

    expect(response.statusCode).toBe(200)
    expect(body.profile).toEqual(expect.objectContaining({ id: ana.id, displayName: 'Ana' }))
    expect(body.consents.map((consent) => consent.kind)).toEqual(['terms', 'privacy'])
    expect(body.assessments).toEqual([
      expect.objectContaining({
        instrument: 'gad7',
        answers: [1, 2, 0, 0, 1, 0, 0],
        totalScore: 4,
      }),
    ])
    expect(body.checkIns.map((checkIn) => checkIn.note)).toEqual(['nota da Ana'])
  })

  it('never exports someone else data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/me/export',
      headers: bearer(bruno),
    })

    expect(response.json<ExportBody>().checkIns.map((checkIn) => checkIn.note)).toEqual([
      'nota do Bruno',
    ])
  })

  it('refuses requests without a session', async () => {
    expect((await app.inject({ method: 'DELETE', url: '/v1/me' })).statusCode).toBe(401)
  })

  it('deletes the account and everything recorded with it', async () => {
    const entry = (await post(ana, '/v1/journal', {})).json<{ id: string }>()
    await uploadJournalImage(ana, entry.id)
    await uploadAvatar(ana)
    const response = await app.inject({ method: 'DELETE', url: '/v1/me', headers: bearer(ana) })
    const afterwards = await app.inject({ method: 'GET', url: '/v1/me', headers: bearer(ana) })
    const user = await fetch(`${testSupabaseUrl}/auth/v1/admin/users/${ana.id}`, {
      headers: { apikey: process.env.SUPABASE_SECRET_KEY ?? '' },
    })

    expect(response.statusCode).toBe(204)
    expect(user.status).toBe(404)
    expect(afterwards.statusCode).toBe(404)
    expect(await storedFiles(journalBucket, ana.id)).toEqual([])
    expect(await storedFiles(avatarBucket, ana.id)).toEqual([])
  })

  it('deletes the registration documents of a professional who leaves', async () => {
    const carla = await createTestUser({ full_name: 'Carla' })
    await registerProfessional(connection.db, carla.id, { status: 'pending' })
    await uploadProfessionalDocument(carla)

    const response = await app.inject({ method: 'DELETE', url: '/v1/me', headers: bearer(carla) })

    expect(response.statusCode).toBe(204)
    expect(await storedFiles(professionalDocumentBucket, carla.id)).toEqual([])
  })

  it('keeps the files of everyone else', async () => {
    await uploadAvatar(bruno)

    expect(await storedFiles(avatarBucket, bruno.id)).toHaveLength(1)
  })
})
