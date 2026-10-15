import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { sharingConsentVersion } from '@mycogni/domain'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { uploadJournalImage } from '../support/storage.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface Entry {
  id: string
  title: string | null
  plainText: string
  imagePaths: string[]
  imageUrls: Record<string, string>
}

function documentWith(text: string, imagePath?: string) {
  return {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text }] },
      { type: 'paragraph', content: [{ type: 'text', text, marks: [{ type: 'bold' }] }] },
      ...(imagePath === undefined ? [] : [{ type: 'image', attrs: { path: imagePath } }]),
    ],
  }
}

describe('/v1/journal', () => {
  let app: App
  let connection: DatabaseConnection
  let helena: TestUser
  let ana: TestUser
  let bruno: TestUser
  let linkId: string

  function call(method: Method, url: string, user: TestUser, payload?: object) {
    return app.inject({
      method,
      url,
      headers: bearer(user),
      ...(payload === undefined ? {} : { payload }),
    })
  }

  async function page(
    user: TestUser,
    title: string,
    imagePath?: (id: string) => Promise<string>,
  ): Promise<Entry> {
    const created = (await call('POST', '/v1/journal', user)).json<Entry>()
    const path = imagePath === undefined ? undefined : await imagePath(created.id)
    const saved = await call('PUT', `/v1/journal/${created.id}`, user, {
      title,
      body: documentWith(title, path),
      plainText: `${title} ${title}`,
      imagePaths: path === undefined ? [] : [path],
    })
    expect(saved.statusCode).toBe(200)
    return saved.json<Entry>()
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser()
    ana = await createTestUser({ full_name: 'Ana Lima' })
    bruno = await createTestUser()
    await registerProfessional(connection.db, helena.id)
    const { invitation } = (
      await call('POST', '/v1/invitations', helena, { channel: 'link', locale: 'pt-BR' })
    ).json<{ invitation: { code: string } }>()
    const claimed = (
      await call('POST', '/v1/invitations/claim', ana, { code: invitation.code })
    ).json<{ id: string }>()
    linkId = (
      await call('POST', `/v1/invitations/${claimed.id}/accept`, ana, {
        sharesHistory: false,
        consentVersion: sharingConsentVersion,
      })
    ).json<{ id: string }>().id
  })

  afterAll(async () => {
    for (const user of [helena, ana, bruno]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('writes a page with formatting and a photo, readable only by its author', async () => {
    const entry = await page(ana, 'Domingo no parque', (id) => uploadJournalImage(ana, id))
    const path = entry.imagePaths[0] ?? ''
    const image = await fetch(entry.imageUrls[path] ?? '')

    expect(entry.title).toBe('Domingo no parque')
    expect(image.status).toBe(200)
    expect((await call('GET', `/v1/journal/${entry.id}`, bruno)).statusCode).toBe(404)
    expect((await call('GET', `/v1/journal/${entry.id}`, helena)).statusCode).toBe(404)
  })

  it('refuses images stored outside the folder of the page', async () => {
    const entry = (await call('POST', '/v1/journal', ana)).json<Entry>()
    const foreign = await uploadJournalImage(bruno, entry.id)

    const response = await call('PUT', `/v1/journal/${entry.id}`, ana, {
      title: null,
      body: documentWith('x', foreign),
      plainText: 'x',
      imagePaths: [foreign],
    })

    expect(response.statusCode).toBe(422)
  })

  it('finds pages by words in the title or the text, newest first', async () => {
    await page(ana, 'Reunião difícil')
    await page(ana, 'Jantar com amigas')

    const found = (await call('GET', '/v1/journal?q=DIF%C3%8DCIL', ana)).json<Entry[]>()
    const all = (await call('GET', '/v1/journal', ana)).json<
      { title: string | null; excerpt: string }[]
    >()

    expect(found.map((entry) => entry.title)).toEqual(['Reunião difícil'])
    expect(all[0]).toEqual(
      expect.objectContaining({
        title: 'Jantar com amigas',
        excerpt: 'Jantar com amigas Jantar com amigas',
      }),
    )
  })

  it('shares chosen pages with the professional, who reads them and leaves a trace', async () => {
    const chosen = await page(ana, 'Para a consulta')
    const share = await call('POST', '/v1/journal/shares', ana, {
      careLinkId: linkId,
      scope: 'entries',
      entryIds: [chosen.id],
      expiresAt: null,
    })
    const shareId = share.json<{ id: string }>().id

    const visible = (await call('GET', `/v1/professional/patients/${ana.id}/journal`, helena)).json<
      Entry[]
    >()
    const read = await call(
      'GET',
      `/v1/professional/patients/${ana.id}/journal/${chosen.id}`,
      helena,
    )
    const access = (await call('GET', `/v1/journal/shares/${shareId}/access`, ana)).json<
      { entryTitle: string }[]
    >()
    const shares = (await call('GET', '/v1/journal/shares', ana)).json<
      { id: string; active: boolean; lastAccessAt: string | null }[]
    >()

    expect(share.statusCode).toBe(201)
    expect(visible.map((entry) => entry.title)).toEqual(['Para a consulta'])
    expect(read.statusCode).toBe(200)
    expect(access).toEqual([expect.objectContaining({ entryTitle: 'Para a consulta' })])
    expect(shares.find((candidate) => candidate.id === shareId)).toEqual(
      expect.objectContaining({ active: true, lastAccessAt: expect.any(String) }),
    )
  })

  it('closes everything again when the patient revokes', async () => {
    const [share] = (await call('GET', '/v1/journal/shares', ana)).json<{ id: string }[]>()

    expect(
      (await call('POST', `/v1/journal/shares/${share?.id ?? ''}/revoke`, ana)).statusCode,
    ).toBe(204)
    expect(
      (await call('GET', `/v1/professional/patients/${ana.id}/journal`, helena)).json(),
    ).toEqual([])
    expect(
      (await call('POST', `/v1/journal/shares/${share?.id ?? ''}/revoke`, ana)).statusCode,
    ).toBe(404)
  })

  it('opens the whole journal until a date and refuses links that are not the patient', async () => {
    const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const whole = await call('POST', '/v1/journal/shares', ana, {
      careLinkId: linkId,
      scope: 'all',
      expiresAt: until,
    })
    const foreign = await call('POST', '/v1/journal/shares', bruno, {
      careLinkId: linkId,
      scope: 'all',
      expiresAt: null,
    })
    const titles = (await call('GET', `/v1/professional/patients/${ana.id}/journal`, helena)).json<
      Entry[]
    >()

    expect(whole.statusCode).toBe(201)
    expect(foreign.statusCode).toBe(404)
    expect(titles.length).toBeGreaterThanOrEqual(4)
  })

  it('deletes a page together with its photos', async () => {
    const entry = await page(ana, 'Apagar', (id) => uploadJournalImage(ana, id))
    const url = Object.values(entry.imageUrls)[0] ?? ''

    expect((await call('DELETE', `/v1/journal/${entry.id}`, ana)).statusCode).toBe(204)
    expect((await call('GET', `/v1/journal/${entry.id}`, ana)).statusCode).toBe(404)
    expect((await fetch(url)).status).toBe(400)
  })
})
