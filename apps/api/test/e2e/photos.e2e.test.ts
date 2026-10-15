import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { avatarBucket, sharingConsentVersion } from '@mycogni/domain'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import { careLinks, invitations } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional, seedInvitation } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { downloadAs, tinyPng, uploadAvatar } from '../support/storage.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

const careLinkListSchema = z.array(
  z.object({ id: z.uuid(), professional: z.object({ photoUrl: z.url().nullable() }) }),
)
const patientSchema = z.object({ id: z.uuid(), photoUrl: z.url().nullable() })
const previewSchema = z.object({ professional: z.object({ photoUrl: z.url().nullable() }) })

describe('profile photos', () => {
  let app: App
  let connection: DatabaseConnection
  let helena: TestUser
  let ana: TestUser
  let bruno: TestUser
  let helenaPhoto: string
  let linkId: string

  function get(url: string, user?: TestUser) {
    return app.inject({
      method: 'GET',
      url,
      ...(user === undefined ? {} : { headers: bearer(user) }),
    })
  }

  async function setPhoto(user: TestUser): Promise<string> {
    const path = await uploadAvatar(user)
    await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(user),
      payload: { avatarPath: path },
    })
    return path
  }

  async function opens(url: string | null | undefined): Promise<boolean> {
    if (url === null || url === undefined) {
      return false
    }
    const response = await fetch(url)
    return response.ok && Buffer.from(await response.arrayBuffer()).equals(tinyPng)
  }

  function avatarsSeenBy(user: TestUser) {
    return withUser(connection.db, user.id, async (tx) =>
      Array.from(
        await tx.execute<{ professional_id: string }>(
          sql`select professional_id from public.linked_professional_avatars()`,
        ),
      ).map((row) => row.professional_id),
    )
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser()
    ana = await createTestUser()
    bruno = await createTestUser()
    await registerProfessional(connection.db, helena.id)
    helenaPhoto = await setPhoto(helena)
    await setPhoto(ana)
    const [link] = await connection.db
      .insert(careLinks)
      .values({
        professionalId: helena.id,
        patientId: ana.id,
        consentVersion: sharingConsentVersion,
      })
      .returning({ id: careLinks.id })
    linkId = link?.id ?? ''
  })

  afterAll(async () => {
    for (const user of [helena, ana, bruno]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('shows the photo of the patient to the linked professional', async () => {
    const list = z
      .array(patientSchema)
      .parse((await get('/v1/professional/patients', helena)).json())
    const file = patientSchema.parse(
      (await get(`/v1/professional/patients/${ana.id}`, helena)).json(),
    )

    expect(await opens(list.find((patient) => patient.id === ana.id)?.photoUrl)).toBe(true)
    expect(await opens(file.photoUrl)).toBe(true)
  })

  it('repeats the same photo link within the hour so browsers can cache the image', async () => {
    const first = patientSchema.parse(
      (await get(`/v1/professional/patients/${ana.id}`, helena)).json(),
    )
    const second = patientSchema.parse(
      (await get(`/v1/professional/patients/${ana.id}`, helena)).json(),
    )
    const token = new URL(first.photoUrl ?? '').searchParams.get('token') ?? ''
    const { exp } = z
      .object({ exp: z.number() })
      .parse(JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')))

    expect(second.photoUrl).toBe(first.photoUrl)
    expect(exp % 3600).toBe(0)
    expect(exp - Date.now() / 1000).toBeGreaterThan(3600)
  })

  it('shows the photo of the professional to the linked patient', async () => {
    const links = careLinkListSchema.parse((await get('/v1/care-links', ana)).json())

    expect(links).toHaveLength(1)
    expect(await opens(links[0]?.professional.photoUrl)).toBe(true)
    expect(await avatarsSeenBy(ana)).toEqual([helena.id])
  })

  it('keeps the photo of the professional away from someone without a link', async () => {
    const storage = await downloadAs(bruno, avatarBucket, helenaPhoto)
    const own = await downloadAs(helena, avatarBucket, helenaPhoto)

    expect(careLinkListSchema.parse((await get('/v1/care-links', bruno)).json())).toEqual([])
    expect(await avatarsSeenBy(bruno)).toEqual([])
    expect(storage.ok).toBe(false)
    expect(own.ok).toBe(true)
  })

  it('shows the photo of the professional on a valid invitation only', async () => {
    const pending = await seedInvitation(connection.db, { professionalId: helena.id })
    const expired = await seedInvitation(connection.db, {
      professionalId: helena.id,
      expired: true,
    })
    const canceled = await seedInvitation(connection.db, { professionalId: helena.id })
    await connection.db
      .update(invitations)
      .set({ status: 'canceled' })
      .where(eq(invitations.id, canceled.id))
    const preview = async (code: string) =>
      previewSchema.parse((await get(`/v1/public/invitations/preview/${code}`)).json())

    const open = await preview(pending.code)
    const late = await preview(expired.code)
    const closed = await preview(canceled.code)

    expect(await opens(open.professional.photoUrl)).toBe(true)
    expect(late.professional.photoUrl).toBeNull()
    expect(closed.professional.photoUrl).toBeNull()
  })

  it('stops sharing the photos once the link ends', async () => {
    await withUser(connection.db, ana.id, (tx) =>
      tx
        .update(careLinks)
        .set({ endedAt: new Date(), endedBy: 'patient' })
        .where(eq(careLinks.id, linkId)),
    )
    const links = careLinkListSchema.parse((await get('/v1/care-links', ana)).json())
    const patient = await get(`/v1/professional/patients/${ana.id}`, helena)

    expect(links).toEqual([])
    expect(await avatarsSeenBy(ana)).toEqual([])
    expect(patient.statusCode).toBe(404)
  })

  it('keeps the photo path inside the folder of its owner', async () => {
    const foreign = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(bruno),
      payload: { avatarPath: helenaPhoto },
    })

    expect(foreign.statusCode).toBe(422)
  })
})
