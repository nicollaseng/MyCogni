import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { isInvitationCode, sharingConsentVersion } from '@mycogni/domain'
import { eq } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { careLinks, professionalProfiles } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { councilNumber, registerProfessional, seedInvitation } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { lastMailTo } from '../support/mailpit.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { allowedOrigin, buildTestApp, supabaseVerifier } from '../support/test-app.ts'

type Method = 'GET' | 'POST'

describe('invitations and care links', () => {
  let app: App
  let connection: DatabaseConnection
  let helena: TestUser
  let pedro: TestUser
  let ana: TestUser
  let bruno: TestUser
  const helenaNumber = councilNumber()

  function call(method: Method, url: string, user?: TestUser, payload?: object) {
    return app.inject({
      method,
      url,
      ...(user === undefined ? {} : { headers: bearer(user) }),
      ...(payload === undefined ? {} : { payload }),
    })
  }

  async function invite(payload: object): Promise<{ id: string; code: string; link: string }> {
    const response = await call('POST', '/v1/invitations', helena, payload)
    expect(response.statusCode).toBe(201)
    return response.json<{ invitation: { id: string; code: string; link: string } }>().invitation
  }

  async function checkIn(user: TestUser, moodLevel: number): Promise<void> {
    const response = await call('POST', '/v1/check-ins', user, {
      moodLevel,
      emotions: [],
      contexts: [],
      note: null,
    })
    expect(response.statusCode).toBe(201)
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser()
    pedro = await createTestUser()
    ana = await createTestUser({ full_name: 'Ana Lima' })
    bruno = await createTestUser({ full_name: 'Bruno Reis' })
    await registerProfessional(connection.db, helena.id, { number: helenaNumber })
    await registerProfessional(connection.db, pedro.id, {
      fullName: 'Pedro Lima',
      status: 'pending',
    })
  })

  afterAll(async () => {
    for (const user of [helena, pedro, ana, bruno]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('lets only verified professionals invite', async () => {
    const pending = await call('POST', '/v1/invitations', pedro, {
      channel: 'link',
      locale: 'pt-BR',
    })
    const patient = await call('POST', '/v1/invitations', ana, { channel: 'link', locale: 'pt-BR' })

    expect(pending.statusCode).toBe(403)
    expect(patient.statusCode).toBe(403)
  })

  it('creates a link invitation with a readable code that lasts 72 hours', async () => {
    const response = await call('POST', '/v1/invitations', helena, {
      channel: 'link',
      locale: 'pt-BR',
    })
    const body = response.json<{
      invitation: {
        code: string
        link: string
        status: string
        createdAt: string
        expiresAt: string
      }
      emailSent: boolean
    }>()

    expect(response.statusCode).toBe(201)
    expect(isInvitationCode(body.invitation.code)).toBe(true)
    expect(body.invitation.link).toBe(`${allowedOrigin}/invite/${body.invitation.code}`)
    expect(body.invitation.status).toBe('pending')
    expect(body.emailSent).toBe(false)
    expect(
      new Date(body.invitation.expiresAt).getTime() - new Date(body.invitation.createdAt).getTime(),
    ).toBe(72 * 60 * 60 * 1000)
  })

  it('emails the invitation in the language the professional chose', async () => {
    const response = await call('POST', '/v1/invitations', helena, {
      channel: 'email',
      recipientEmail: ` ${bruno.email.toUpperCase()} `,
      locale: 'en-GB',
    })
    const body = response.json<{
      invitation: { code: string; recipientEmail: string }
      emailSent: boolean
    }>()
    const mail = await lastMailTo(bruno.email)

    expect(body.emailSent).toBe(true)
    expect(body.invitation.recipientEmail).toBe(bruno.email)
    expect(mail?.Subject).toBe('Dra. Helena Prado invited you to MyCogniAI')
    expect(mail?.HTML).toContain(`${allowedOrigin}/invite/${body.invitation.code}`)
  })

  it('shows anyone who opens the link who is inviting, without a session', async () => {
    const { code } = await invite({ channel: 'link', locale: 'pt-BR' })

    const preview = await call('GET', `/v1/public/invitations/preview/${code.toLowerCase()}`)
    const unknown = await call('GET', '/v1/public/invitations/preview/ZZZZZZZZ')
    const malformed = await call('GET', '/v1/public/invitations/preview/abc')

    expect(preview.statusCode).toBe(200)
    expect(preview.json()).toEqual({
      professional: { name: 'Dra. Helena Prado', kind: 'psychologist', photoUrl: null },
      status: 'pending',
      expiresAt: expect.any(String),
    })
    expect(unknown.statusCode).toBe(404)
    expect(malformed.statusCode).toBe(400)
  })

  it('takes the patient from the link to the bell, and to sharing after accepting', async () => {
    await checkIn(ana, 1)
    const { id, code } = await invite({ channel: 'link', locale: 'pt-BR' })

    const claimed = await call('POST', '/v1/invitations/claim', ana, { code })
    expect(claimed.json()).toEqual(
      expect.objectContaining({
        id,
        status: 'pending',
        professional: {
          name: 'Dra. Helena Prado',
          kind: 'psychologist',
          registration: `CRP 06/${helenaNumber}`,
        },
      }),
    )
    const bell = (await call('GET', '/v1/notifications', ana)).json<{
      unread: number
      items: { kind: string; invitation: { id: string; status: string } | null }[]
    }>()
    expect(bell.unread).toBe(1)
    expect(bell.items[0]).toEqual(
      expect.objectContaining({
        kind: 'invitation',
        invitation: expect.objectContaining({ id, status: 'pending' }),
      }),
    )

    const accepted = await call('POST', `/v1/invitations/${id}/accept`, ana, {
      sharesHistory: false,
      consentVersion: sharingConsentVersion,
    })
    expect(accepted.statusCode).toBe(201)
    expect(accepted.json()).toEqual(
      expect.objectContaining({
        sharesHistory: false,
        consentVersion: sharingConsentVersion,
        termsOutdated: false,
        professional: expect.objectContaining({ name: 'Dra. Helena Prado' }),
      }),
    )
    expect((await call('GET', '/v1/notifications', ana)).json<{ unread: number }>().unread).toBe(0)
    expect(
      (
        await call('POST', `/v1/invitations/${id}/accept`, ana, {
          sharesHistory: true,
          consentVersion: sharingConsentVersion,
        })
      ).statusCode,
    ).toBe(409)
  })

  it('shows the professional only the records shared from the link onward', async () => {
    await checkIn(ana, 5)

    const patients = (await call('GET', '/v1/professional/patients', helena)).json<
      {
        id: string
        name: string
        lastCheckIn: { moodLevel: number } | null
        checkInsLastWeek: number
      }[]
    >()
    const records = (
      await call('GET', `/v1/professional/patients/${ana.id}/check-ins`, helena)
    ).json<{ moodLevel: number }[]>()

    expect(patients).toEqual([
      expect.objectContaining({
        id: ana.id,
        name: 'Ana Lima',
        lastCheckIn: expect.objectContaining({ moodLevel: 5 }),
        checkInsLastWeek: 1,
      }),
    ])
    expect(records.map((record) => record.moodLevel)).toEqual([5])
    expect((await call('GET', `/v1/professional/patients/${bruno.id}`, helena)).statusCode).toBe(
      404,
    )
    expect((await call('GET', '/v1/professional/patients', pedro)).statusCode).toBe(403)
  })

  it('shares the earlier records when the patient chooses to', async () => {
    await checkIn(bruno, 2)
    const { id, code } = await invite({ channel: 'link', locale: 'pt-BR' })
    await call('POST', '/v1/invitations/claim', bruno, { code })

    await call('POST', `/v1/invitations/${id}/accept`, bruno, {
      sharesHistory: true,
      consentVersion: sharingConsentVersion,
    })
    const records = (
      await call('GET', `/v1/professional/patients/${bruno.id}/check-ins`, helena)
    ).json<{ moodLevel: number }[]>()

    expect(records.map((record) => record.moodLevel)).toEqual([2])
  })

  it('attaches email invitations when the invited person signs in', async () => {
    const attached = await call('POST', '/v1/invitations/attach', bruno)
    const received = (await call('GET', '/v1/invitations/received', bruno)).json<
      { status: string }[]
    >()

    expect(attached.json()).toEqual({ attached: 1 })
    expect(received.map((invitation) => invitation.status).sort()).toEqual(['accepted', 'pending'])
  })

  it('lets the patient decline an invitation', async () => {
    const pending = (await call('GET', '/v1/invitations/received', bruno))
      .json<{ id: string; status: string }[]>()
      .find((invitation) => invitation.status === 'pending')

    expect(
      (await call('POST', `/v1/invitations/${pending?.id ?? ''}/decline`, bruno)).statusCode,
    ).toBe(204)
    expect(
      (await call('POST', `/v1/invitations/${pending?.id ?? ''}/decline`, bruno)).statusCode,
    ).toBe(409)
  })

  it('lets the professional cancel and send again', async () => {
    const { id } = await invite({
      channel: 'email',
      recipientEmail: 'nova@test.mycogni.local',
      locale: 'pt-BR',
    })

    const resent = await call('POST', `/v1/invitations/${id}/resend`, helena, { locale: 'pt-PT' })
    const newId = resent.json<{ invitation: { id: string } }>().invitation.id
    const sent = (await call('GET', '/v1/invitations/sent', helena)).json<
      { id: string; status: string }[]
    >()

    expect(resent.statusCode).toBe(201)
    expect(sent.find((invitation) => invitation.id === id)?.status).toBe('canceled')
    expect((await call('POST', `/v1/invitations/${newId}/cancel`, helena)).statusCode).toBe(204)
    expect((await call('POST', `/v1/invitations/${newId}/cancel`, helena)).statusCode).toBe(404)
    expect(
      (await call('POST', `/v1/invitations/${id}/resend`, helena, { locale: 'pt-BR' })).statusCode,
    ).toBe(409)
    expect((await lastMailTo('nova@test.mycogni.local'))?.Subject).toBe(
      'Dra. Helena Prado enviou-lhe um convite para o MyCogniAI',
    )
  })

  it('lets the patient end the link, which hides the records again', async () => {
    const links = (await call('GET', '/v1/care-links', ana)).json<{ id: string }[]>()

    expect(links).toHaveLength(1)
    expect((await call('POST', `/v1/care-links/${links[0]?.id ?? ''}/end`, ana)).statusCode).toBe(
      204,
    )
    expect((await call('GET', '/v1/care-links', ana)).json()).toEqual([])
    expect(
      (await call('GET', `/v1/professional/patients/${ana.id}/check-ins`, helena)).statusCode,
    ).toBe(404)
    expect(
      (await call('GET', '/v1/professional/patients', helena))
        .json<{ id: string }[]>()
        .map((patient) => patient.id),
    ).toEqual([bruno.id])
  })

  it('does not link a patient to a professional who is no longer verified', async () => {
    const invitation = await seedInvitation(connection.db, {
      professionalId: pedro.id,
      patientId: bruno.id,
    })

    const accepted = await call('POST', `/v1/invitations/${invitation.id}/accept`, bruno, {
      sharesHistory: false,
      consentVersion: sharingConsentVersion,
    })

    expect(accepted.statusCode).toBe(409)
    expect(accepted.json()).toEqual(expect.objectContaining({ code: 'PROFESSIONAL_UNAVAILABLE' }))
  })

  it('hides a professional who is no longer verified from the patient list', async () => {
    await connection.db.insert(careLinks).values({
      professionalId: pedro.id,
      patientId: bruno.id,
      consentVersion: sharingConsentVersion,
    })
    const before = (await call('GET', '/v1/care-links', bruno)).json<
      { professional: { name: string } }[]
    >()
    await connection.db
      .update(professionalProfiles)
      .set({ status: 'verified', verifiedAt: new Date() })
      .where(eq(professionalProfiles.userId, pedro.id))

    const after = (await call('GET', '/v1/care-links', bruno)).json<
      { professional: { name: string } }[]
    >()

    expect(before.map((link) => link.professional.name)).not.toContain('Pedro Lima')
    expect(after.map((link) => link.professional.name)).toContain('Pedro Lima')
  })
})
