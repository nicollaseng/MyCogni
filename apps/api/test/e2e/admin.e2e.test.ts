import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { sharingConsentVersion } from '@mycogni/domain'
import { eq } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { careLinks, invitations, professionalProfiles } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { councilNumber, makeAdmin, seedInvitation } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { addProfilePhoto, sendRegistrationDocument } from '../support/documents.ts'
import { mailCountTo, mailMatching } from '../support/mailpit.ts'
import {
  bearer,
  createTestUser,
  deleteTestUser,
  professionalAccount,
  type TestUser,
} from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

interface Notification {
  kind: string
  review: { decision: string; note: string | null } | null
  unavailableProfessional: { name: string } | null
}

interface Detail {
  status: string
  photoUrl: string | null
  activeLinks: number
  pendingInvitations: number
  history: { decision: string; note: string | null; adminEmail: string | null }[]
}

describe('/v1/admin/professionals', () => {
  let app: App
  let connection: DatabaseConnection
  let admin: TestUser
  let marta: TestUser
  let rui: TestUser
  let lia: TestUser
  let caio: TestUser
  let ana: TestUser
  const martaNumber = councilNumber()

  function call(method: 'GET' | 'POST' | 'PATCH', url: string, user: TestUser, payload?: object) {
    return app.inject({
      method,
      url,
      headers: bearer(user),
      ...(payload === undefined ? {} : { payload }),
    })
  }

  function register(user: TestUser, fullName: string, number = councilNumber()) {
    return call('POST', '/v1/professional', user, {
      kind: 'psychiatrist',
      fullName,
      registration: { uf: 'SP', number },
    })
  }

  function review(user: TestUser, professional: TestUser, payload: object) {
    return call('POST', `/v1/admin/professionals/${professional.id}/review`, user, payload)
  }

  async function detailOf(professional: TestUser): Promise<Detail> {
    const response = await call('GET', `/v1/admin/professionals/${professional.id}`, admin)
    expect(response.statusCode).toBe(200)
    return response.json<Detail>()
  }

  async function notificationsOf(user: TestUser): Promise<Notification[]> {
    return (await call('GET', '/v1/notifications', user)).json<{ items: Notification[] }>().items
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    admin = await createTestUser()
    marta = await createTestUser(professionalAccount)
    rui = await createTestUser(professionalAccount)
    lia = await createTestUser(professionalAccount)
    caio = await createTestUser(professionalAccount)
    ana = await createTestUser({ full_name: 'Ana Lima' })
    await makeAdmin(connection.db, admin.id)
    await register(marta, 'Marta Sousa', martaNumber)
    await register(lia, 'Lia Campos')
    await call('PATCH', '/v1/me', marta, { locale: 'pt-BR' })
    await call('PATCH', '/v1/me', lia, { locale: 'pt-BR' })
    await sendRegistrationDocument(app, marta, 'Carteira CRM.pdf')
  })

  afterAll(async () => {
    for (const user of [admin, marta, rui, lia, caio, ana]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('keeps the review away from everyone outside the team', async () => {
    const list = await call('GET', '/v1/admin/professionals', rui)
    const detail = await call('GET', `/v1/admin/professionals/${marta.id}`, rui)
    const verified = await review(marta, marta, { status: 'verified' })

    expect(list.statusCode).toBe(403)
    expect(detail.statusCode).toBe(403)
    expect(verified.statusCode).toBe(403)
  })

  it('lists the professionals waiting with their structured registration and document', async () => {
    const response = await call('GET', '/v1/admin/professionals?status=pending', admin)

    expect(response.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: marta.id,
          fullName: 'Marta Sousa',
          registration: `CRM-SP ${martaNumber}`,
          council: 'crm',
          registrationNeedsReview: false,
          email: marta.email,
          status: 'pending',
          verifiedAt: null,
          hasPhoto: false,
          activeLinks: 0,
          pendingInvitations: 0,
          document: expect.objectContaining({
            fileName: 'Carteira CRM.pdf',
            contentType: 'application/pdf',
          }),
        }),
        expect.objectContaining({ userId: lia.id, document: null }),
      ]),
    )
  })

  it('flags a registration kept from free text for a manual check', async () => {
    await connection.db.insert(professionalProfiles).values({
      userId: caio.id,
      kind: 'psychologist',
      fullName: 'Caio Reis',
      registrationText: 'CRP 10/1234',
    })

    const detail = await call('GET', `/v1/admin/professionals/${caio.id}`, admin)

    expect(detail.json()).toEqual(
      expect.objectContaining({
        registration: 'CRP 10/1234',
        council: 'crp',
        registrationNeedsReview: true,
        photoUrl: null,
        history: [],
      }),
    )
  })

  it('does not verify someone who has not sent a registration document', async () => {
    const response = await review(admin, lia, { status: 'verified' })

    expect(response.statusCode).toBe(409)
    expect((await detailOf(lia)).status).toBe('pending')
  })

  it('does not verify someone without a profile photo to compare with the document', async () => {
    const response = await review(admin, marta, { status: 'verified' })
    const detail = await detailOf(marta)

    expect(response.statusCode).toBe(409)
    expect(detail.status).toBe('pending')
    expect(detail.history).toEqual([])
    expect(await notificationsOf(marta)).toEqual([])
  })

  it('verifies a professional, records who did it, and tells them in the bell and by email', async () => {
    await addProfilePhoto(app, marta)

    const verified = await review(admin, marta, { status: 'verified' })
    const detail = await detailOf(marta)
    const invitation = await call('POST', '/v1/invitations', marta, {
      channel: 'link',
      locale: 'pt-PT',
    })
    const mail = await mailMatching(marta.email, 'Seu cadastro foi verificado')

    expect(verified.statusCode).toBe(204)
    expect(detail.status).toBe('verified')
    expect(detail.photoUrl).toEqual(expect.stringContaining('/storage/v1/object/sign/avatars/'))
    expect(detail.history).toEqual([
      expect.objectContaining({ decision: 'verified', note: null, adminEmail: admin.email }),
    ])
    expect(await notificationsOf(marta)).toEqual([
      expect.objectContaining({
        kind: 'professional',
        review: { decision: 'verified', note: null },
        unavailableProfessional: null,
      }),
    ])
    expect(mail.Text).toContain('Convide pacientes por email ou por link.')
    expect(mail.HTML).toContain('http://localhost:3000/pro')
    expect(invitation.statusCode).toBe(201)
  })

  it('rejects only with a note, which reaches the professional in the bell and by email', async () => {
    const silent = await review(admin, lia, { status: 'rejected' })
    const rejected = await review(admin, lia, {
      status: 'rejected',
      note: '  Envie a carteira do conselho.  ',
    })
    const profile = await call('GET', '/v1/professional', lia)
    const mail = await mailMatching(lia.email, 'Seu cadastro não foi aprovado')

    expect(silent.statusCode).toBe(400)
    expect(rejected.statusCode).toBe(204)
    expect(profile.json()).toEqual(
      expect.objectContaining({ status: 'rejected', reviewNote: 'Envie a carteira do conselho.' }),
    )
    expect(await notificationsOf(lia)).toEqual([
      expect.objectContaining({
        kind: 'professional',
        review: { decision: 'rejected', note: 'Envie a carteira do conselho.' },
      }),
    ])
    expect(mail.Text).toMatch(/Motivo:\s+Envie a carteira do conselho\./)
    expect((await detailOf(lia)).history).toEqual([
      expect.objectContaining({ decision: 'rejected', note: 'Envie a carteira do conselho.' }),
    ])
  })

  it('revalidates a verified professional without telling them again', async () => {
    const emails = await mailCountTo(marta.email)

    const revalidated = await review(admin, marta, { status: 'verified' })
    const detail = await detailOf(marta)

    expect(revalidated.statusCode).toBe(204)
    expect(detail.history.map((entry) => entry.decision)).toEqual(['verified', 'verified'])
    expect(await notificationsOf(marta)).toHaveLength(1)
    expect(await mailCountTo(marta.email)).toBe(emails)
  })

  it('ends the links and invitations of a verified professional who is rejected', async () => {
    const [link] = await connection.db
      .insert(careLinks)
      .values({
        professionalId: marta.id,
        patientId: ana.id,
        consentVersion: sharingConsentVersion,
      })
      .returning({ id: careLinks.id })
    const pending = await seedInvitation(connection.db, { professionalId: marta.id })
    expect(await detailOf(marta)).toEqual(
      expect.objectContaining({ activeLinks: 1, pendingInvitations: expect.any(Number) }),
    )

    const rejected = await review(admin, marta, {
      status: 'rejected',
      note: 'Registro cancelado no conselho.',
    })
    const [ended] = await connection.db
      .select({ endedAt: careLinks.endedAt, endedBy: careLinks.endedBy })
      .from(careLinks)
      .where(eq(careLinks.id, link?.id ?? ''))
    const [invitation] = await connection.db
      .select({ status: invitations.status })
      .from(invitations)
      .where(eq(invitations.id, pending.id))
    const detail = await detailOf(marta)
    const patientLinks = await call('GET', '/v1/care-links', ana)

    expect(rejected.statusCode).toBe(204)
    expect(ended).toEqual({ endedAt: expect.any(Date), endedBy: 'team' })
    expect(invitation?.status).toBe('canceled')
    expect(detail).toEqual(expect.objectContaining({ activeLinks: 0, pendingInvitations: 0 }))
    expect(detail.history.map((entry) => entry.decision)).toEqual([
      'rejected',
      'verified',
      'verified',
    ])
    expect(await notificationsOf(ana)).toEqual([
      expect.objectContaining({
        kind: 'professional',
        review: null,
        unavailableProfessional: { name: 'Marta Sousa' },
      }),
    ])
    expect(patientLinks.json()).toEqual([])
    await mailMatching(marta.email, 'Seu cadastro não foi aprovado')
  })

  it('answers 404 for someone who never registered as a professional', async () => {
    const response = await review(admin, rui, { status: 'rejected', note: 'Sem cadastro.' })
    const detail = await call('GET', `/v1/admin/professionals/${rui.id}`, admin)

    expect(response.statusCode).toBe(404)
    expect(detail.statusCode).toBe(404)
  })

  it('does not accept going back to pending', async () => {
    const response = await review(admin, marta, { status: 'pending' })

    expect(response.statusCode).toBe(400)
  })
})
