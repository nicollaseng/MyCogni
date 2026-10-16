import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { CareLink, ProfessionalProfile } from '@mycogni/contracts'
import { eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import { professionalProfiles } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { linkPatient, send } from '../support/alerts.ts'
import { registerProfessional, seedInvitation } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

const number = '+5511987654321'

describe('emergency WhatsApp of a professional', () => {
  let app: App
  let connection: DatabaseConnection
  let helena: TestUser
  let rui: TestUser
  let ana: TestUser
  let bia: TestUser
  let carla: TestUser
  let carlaLink: string

  function setNumber(user: TestUser, emergencyWhatsapp: string | null) {
    return app.inject({
      method: 'PUT',
      url: '/v1/professional/emergency-whatsapp',
      headers: bearer(user),
      payload: { emergencyWhatsapp },
    })
  }

  async function linksOf(patient: TestUser): Promise<CareLink[]> {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/care-links',
      headers: bearer(patient),
    })
    expect(response.statusCode).toBe(200)
    return response.json<CareLink[]>()
  }

  function readColumnAs(userId: string) {
    return withUser(connection.db, userId, (tx) =>
      tx.execute(sql`select emergency_whatsapp from public.professional_profiles`),
    )
  }

  function linkedNumbersAs(userId: string) {
    return withUser(connection.db, userId, async (tx) =>
      Array.from(await tx.execute(sql`select * from public.linked_professional_whatsapp()`)),
    )
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser()
    rui = await createTestUser()
    ana = await createTestUser({ full_name: 'Ana Lima' })
    bia = await createTestUser({ full_name: 'Bia Souza' })
    carla = await createTestUser({ full_name: 'Carla Nunes' })
    await registerProfessional(connection.db, helena.id, { fullName: 'Helena Prado' })
    await registerProfessional(connection.db, rui.id, { fullName: 'Rui Lima' })
    await linkPatient(app, helena, ana, false)
    carlaLink = await linkPatient(app, helena, carla, false)
    await seedInvitation(connection.db, { professionalId: helena.id, patientId: bia.id })
  })

  afterAll(async () => {
    for (const user of [helena, rui, ana, bia, carla]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('lets the professional set the number and read it back', async () => {
    const response = await setNumber(helena, number)

    expect(response.statusCode).toBe(200)
    expect(response.json<ProfessionalProfile>().emergencyWhatsapp).toBe(number)
    const profile = await app.inject({
      method: 'GET',
      url: '/v1/professional',
      headers: bearer(helena),
    })
    expect(profile.json<ProfessionalProfile>().emergencyWhatsapp).toBe(number)
  })

  it.each(['5511987654321', '+55 11 98765-4321', '+0511987654321', '+5511', 'whatsapp'])(
    'refuses %s',
    async (invalid) => {
      expect((await setNumber(helena, invalid)).statusCode).toBe(400)
    },
  )

  it('refuses a malformed number even outside the API', async () => {
    await expect(
      connection.db
        .update(professionalProfiles)
        .set({ emergencyWhatsapp: '11987654321' })
        .where(eq(professionalProfiles.userId, helena.id)),
    ).rejects.toThrow()
  })

  it('only lets each professional change their own number', async () => {
    expect((await setNumber(ana, number)).statusCode).toBe(403)
    const updated = await withUser(connection.db, rui.id, (tx) =>
      tx
        .update(professionalProfiles)
        .set({ emergencyWhatsapp: '+5521999990000' })
        .where(eq(professionalProfiles.userId, helena.id))
        .returning({ userId: professionalProfiles.userId }),
    )

    expect(updated).toEqual([])
    expect((await setNumber(rui, '+5521999990000')).statusCode).toBe(200)
    const [row] = await connection.db
      .select({ emergencyWhatsapp: professionalProfiles.emergencyWhatsapp })
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, helena.id))
    expect(row?.emergencyWhatsapp).toBe(number)
  })

  it('shows the number to the patients currently linked to the professional', async () => {
    const [link] = await linksOf(ana)

    expect(link?.professional).toEqual(
      expect.objectContaining({ name: 'Helena Prado', emergencyWhatsapp: number }),
    )
    expect(await linkedNumbersAs(ana.id)).toEqual([
      { professional_id: helena.id, emergency_whatsapp: number },
    ])
  })

  it('never exposes the column through the table and shows nothing to invited people', async () => {
    for (const user of [ana, bia, rui, helena]) {
      await expect(readColumnAs(user.id)).rejects.toThrow()
    }
    expect(await linksOf(bia)).toEqual([])
    expect(await linkedNumbersAs(bia.id)).toEqual([])
    expect(await linkedNumbersAs(rui.id)).toEqual([])
  })

  it('stops showing the number once the link ends', async () => {
    expect((await linksOf(carla))[0]?.professional.emergencyWhatsapp).toBe(number)

    await send(app, carla, `/v1/care-links/${carlaLink}/end`)

    expect(await linksOf(carla)).toEqual([])
    expect(await linkedNumbersAs(carla.id)).toEqual([])
  })

  it('lets the professional clear the number', async () => {
    const response = await setNumber(helena, null)

    expect(response.statusCode).toBe(200)
    expect(response.json<ProfessionalProfile>().emergencyWhatsapp).toBeNull()
    expect((await linksOf(ana))[0]?.professional.emergencyWhatsapp).toBeNull()
    expect(await linkedNumbersAs(ana.id)).toEqual([])
  })
})
