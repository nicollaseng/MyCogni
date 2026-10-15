import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { sharingConsentVersion } from '@mycogni/domain'
import { eq } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { careLinks } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

type Method = 'GET' | 'POST'

const previousVersion = '2026-10'

interface LinkView {
  id: string
  consentVersion: string
  termsOutdated: boolean
}

interface PatientView {
  id: string
  termsOutdated: boolean
}

describe('sharing terms', () => {
  let app: App
  let connection: DatabaseConnection
  let helena: TestUser
  let caio: TestUser
  let ana: TestUser
  let bruno: TestUser
  let pending: string
  let ended: string

  function call(method: Method, url: string, user: TestUser, payload?: object) {
    return app.inject({
      method,
      url,
      headers: bearer(user),
      ...(payload === undefined ? {} : { payload }),
    })
  }

  function confirm(user: TestUser, id: string, consentVersion: string = sharingConsentVersion) {
    return call('POST', `/v1/care-links/${id}/terms`, user, { consentVersion })
  }

  async function link(professional: TestUser, patient: TestUser): Promise<string> {
    const created = await call('POST', '/v1/invitations', professional, {
      channel: 'link',
      locale: 'pt-BR',
    })
    const { code } = created.json<{ invitation: { code: string } }>().invitation
    const claimed = await call('POST', '/v1/invitations/claim', patient, { code })
    const accepted = await call(
      'POST',
      `/v1/invitations/${claimed.json<{ id: string }>().id}/accept`,
      patient,
      { sharesHistory: false, consentVersion: sharingConsentVersion },
    )
    expect(accepted.statusCode).toBe(201)
    return accepted.json<{ id: string }>().id
  }

  async function ageTerms(id: string): Promise<void> {
    const [row] = await connection.db
      .select({ startedAt: careLinks.startedAt })
      .from(careLinks)
      .where(eq(careLinks.id, id))
    await connection.db
      .update(careLinks)
      .set({ consentVersion: previousVersion, consentAcceptedAt: row?.startedAt })
      .where(eq(careLinks.id, id))
  }

  async function stored(id: string) {
    const [row] = await connection.db.select().from(careLinks).where(eq(careLinks.id, id))
    return row
  }

  async function patientsOf(professional: TestUser): Promise<PatientView[]> {
    return (await call('GET', '/v1/professional/patients', professional)).json<PatientView[]>()
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser()
    caio = await createTestUser()
    ana = await createTestUser({ full_name: 'Ana Lima' })
    bruno = await createTestUser({ full_name: 'Bruno Reis' })
    await registerProfessional(connection.db, helena.id)
    await registerProfessional(connection.db, caio.id, { fullName: 'Dr. Caio Reis' })
    pending = await link(helena, ana)
    ended = await link(caio, ana)
    await link(helena, bruno)
    await ageTerms(pending)
    await ageTerms(ended)
    expect((await call('POST', `/v1/care-links/${ended}/end`, ana)).statusCode).toBe(204)
  })

  afterAll(async () => {
    for (const user of [helena, caio, ana, bruno]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('tells the patient and the professional which links wait for the new terms', async () => {
    const links = (await call('GET', '/v1/care-links', ana)).json<LinkView[]>()

    expect(links).toEqual([
      expect.objectContaining({
        id: pending,
        consentVersion: previousVersion,
        termsOutdated: true,
      }),
    ])
    expect(await patientsOf(helena)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: ana.id, termsOutdated: true }),
        expect.objectContaining({ id: bruno.id, termsOutdated: false }),
      ]),
    )
  })

  it('keeps sharing under the terms accepted before while the confirmation is pending', async () => {
    await call('POST', '/v1/check-ins', ana, {
      moodLevel: 4,
      emotions: [],
      contexts: [],
      note: null,
    })

    const records = await call('GET', `/v1/professional/patients/${ana.id}/check-ins`, helena)

    expect(records.statusCode).toBe(200)
    expect(records.json<{ moodLevel: number }[]>().map((record) => record.moodLevel)).toEqual([4])
  })

  it('lets only the patient of the active link confirm the terms', async () => {
    expect((await confirm(helena, pending)).statusCode).toBe(404)
    expect((await confirm(bruno, pending)).statusCode).toBe(404)
    expect((await confirm(caio, ended)).statusCode).toBe(404)
    expect((await confirm(ana, ended)).statusCode).toBe(404)
    expect((await confirm(ana, randomUUID())).statusCode).toBe(404)
    expect((await stored(pending))?.consentVersion).toBe(previousVersion)
    expect((await stored(ended))?.consentVersion).toBe(previousVersion)
  })

  it('accepts only the current version of the terms', async () => {
    expect((await confirm(ana, pending, previousVersion)).statusCode).toBe(400)
    expect((await confirm(ana, pending, '2099-01-01')).statusCode).toBe(400)
    expect((await call('POST', `/v1/care-links/${pending}/terms`, ana, {})).statusCode).toBe(400)
    expect((await confirm(ana, 'not-a-link')).statusCode).toBe(400)
    expect((await stored(pending))?.consentVersion).toBe(previousVersion)
  })

  it('records the confirmation and nothing else, clearing the pending state', async () => {
    const before = await stored(pending)

    expect((await confirm(ana, pending)).statusCode).toBe(204)

    const after = await stored(pending)
    expect(after).toEqual({
      ...before,
      consentVersion: sharingConsentVersion,
      consentAcceptedAt: expect.any(Date),
    })
    expect(after?.consentAcceptedAt.getTime()).toBeGreaterThan(before?.startedAt.getTime() ?? 0)
    expect((await call('GET', '/v1/care-links', ana)).json<LinkView[]>()).toEqual([
      expect.objectContaining({
        id: pending,
        consentVersion: sharingConsentVersion,
        termsOutdated: false,
      }),
    ])
    expect((await patientsOf(helena)).every((patient) => !patient.termsOutdated)).toBe(true)
    expect((await confirm(ana, pending)).statusCode).toBe(204)
  })
})
