import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { sharingConsentVersion } from '@mycogni/domain'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { careLinks, checkIns } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

describe('/v1/check-ins/:id', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser
  let helena: TestUser
  let caio: TestUser
  let recent: string
  let earlier: string

  function detail(user: TestUser, id: string) {
    return app.inject({ method: 'GET', url: `/v1/check-ins/${id}`, headers: bearer(user) })
  }

  function append(user: TestUser, id: string, text: unknown) {
    return app.inject({
      method: 'POST',
      url: `/v1/check-ins/${id}/addenda`,
      headers: bearer(user),
      payload: { text },
    })
  }

  function shared(user: TestUser, id: string) {
    return app.inject({
      method: 'GET',
      url: `/v1/professional/patients/${ana.id}/check-ins/${id}`,
      headers: bearer(user),
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser()
    bruno = await createTestUser()
    helena = await createTestUser()
    caio = await createTestUser()
    await registerProfessional(connection.db, helena.id)
    await registerProfessional(connection.db, caio.id, { fullName: 'Caio Mendes' })
    await connection.db.insert(careLinks).values({
      professionalId: helena.id,
      patientId: ana.id,
      consentVersion: sharingConsentVersion,
      sharesHistory: false,
      startedAt: new Date('2026-10-05T12:00:00Z'),
    })
    const rows = await connection.db
      .insert(checkIns)
      .values([
        {
          userId: ana.id,
          moodLevel: 2,
          emotions: ['anxiety'],
          contexts: ['work'],
          note: 'Prazo apertado',
          recordedAt: new Date('2026-10-09T12:00:00Z'),
        },
        { userId: ana.id, moodLevel: 4, recordedAt: new Date('2026-10-01T12:00:00Z') },
      ])
      .returning({ id: checkIns.id, moodLevel: checkIns.moodLevel })
    recent = rows.find((row) => row.moodLevel === 2)?.id ?? ''
    earlier = rows.find((row) => row.moodLevel === 4)?.id ?? ''
  })

  afterAll(async () => {
    for (const user of [ana, bruno, helena, caio]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('refuses requests without a session', async () => {
    const response = await app.inject({ method: 'GET', url: `/v1/check-ins/${recent}` })

    expect(response.statusCode).toBe(401)
  })

  it('opens a record of the person with no additions yet', async () => {
    const response = await detail(ana, recent)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      id: recent,
      moodLevel: 2,
      emotions: ['anxiety'],
      contexts: ['work'],
      note: 'Prazo apertado',
      recordedAt: '2026-10-09T12:00:00.000Z',
      addenda: [],
    })
  })

  it('adds timestamped notes below the record in the order they were written', async () => {
    const first = await append(ana, recent, '  Relendo: o prazo foi cumprido.  ')
    const second = await append(ana, recent, 'E dormi bem depois.')

    expect(first.statusCode).toBe(201)
    expect(first.json()).toEqual({
      id: expect.any(String),
      text: 'Relendo: o prazo foi cumprido.',
      createdAt: expect.any(String),
      support: { level: 'none' },
    })
    expect(second.statusCode).toBe(201)
    const { addenda, note, moodLevel } = (await detail(ana, recent)).json<{
      addenda: { text: string }[]
      note: string
      moodLevel: number
    }>()
    expect(addenda.map((addendum) => addendum.text)).toEqual([
      'Relendo: o prazo foi cumprido.',
      'E dormi bem depois.',
    ])
    expect({ note, moodLevel }).toEqual({ note: 'Prazo apertado', moodLevel: 2 })
  })

  it('refuses empty or too long additions', async () => {
    expect((await append(ana, recent, '   ')).statusCode).toBe(400)
    expect((await append(ana, recent, 'a'.repeat(1001))).statusCode).toBe(400)
    expect((await append(ana, recent, 'a'.repeat(1000))).statusCode).toBe(201)
  })

  it('offers no way to change or remove the record or its additions', async () => {
    const { addenda } = (await detail(ana, recent)).json<{ addenda: { id: string }[] }>()
    const addendum = addenda[0]?.id ?? ''
    const attempts = await Promise.all([
      app.inject({ method: 'PUT', url: `/v1/check-ins/${recent}`, headers: bearer(ana) }),
      app.inject({ method: 'DELETE', url: `/v1/check-ins/${recent}`, headers: bearer(ana) }),
      app.inject({
        method: 'PATCH',
        url: `/v1/check-ins/${recent}/addenda/${addendum}`,
        headers: bearer(ana),
        payload: { text: 'outra coisa' },
      }),
      app.inject({
        method: 'DELETE',
        url: `/v1/check-ins/${recent}/addenda/${addendum}`,
        headers: bearer(ana),
      }),
    ])

    expect(attempts.map((attempt) => attempt.statusCode)).toEqual([404, 404, 404, 404])
  })

  it('answers not found to any other patient and refuses professional accounts', async () => {
    const responses = [
      await detail(bruno, recent),
      await append(bruno, recent, 'intruso'),
      await detail(helena, recent),
      await append(helena, recent, 'nota da profissional'),
    ]

    expect(responses.map((response) => response.statusCode)).toEqual([404, 404, 403, 403])
  })

  it('validates the record id', async () => {
    expect((await detail(ana, 'not-an-id')).statusCode).toBe(400)
  })

  it('lets the linked professional read a shared record with its additions, read only', async () => {
    const response = await shared(helena, recent)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: recent,
        note: 'Prazo apertado',
        addenda: expect.arrayContaining([
          expect.objectContaining({ text: 'Relendo: o prazo foi cumprido.' }),
        ]),
      }),
    )
  })

  it('keeps from the professional what the person did not share', async () => {
    expect((await shared(helena, earlier)).statusCode).toBe(404)
    expect((await shared(caio, recent)).statusCode).toBe(404)
    expect((await shared(bruno, recent)).statusCode).toBe(403)
  })
})
