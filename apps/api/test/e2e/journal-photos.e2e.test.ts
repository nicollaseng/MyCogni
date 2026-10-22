import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { JournalPhotoPage } from '@mycogni/contracts'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { uploadJournalImage } from '../support/storage.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

type Method = 'GET' | 'POST' | 'PUT'

function image(path: string, attrs: Record<string, unknown> = {}) {
  return { type: 'image', attrs: { path, ...attrs } }
}

describe('/v1/journal/photos', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser
  let helena: TestUser
  const paths: Record<string, string> = {}
  const pages: Record<string, string> = {}

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
    content: (id: string) => Promise<{ body: object[]; images: string[] }>,
  ): Promise<string> {
    const { id } = (await call('POST', '/v1/journal', user)).json<{ id: string }>()
    const { body, images } = await content(id)
    const saved = await call('PUT', `/v1/journal/${id}`, user, {
      title,
      body: { type: 'doc', content: body },
      plainText: title,
      imagePaths: images,
    })
    expect(saved.statusCode).toBe(200)
    return id
  }

  async function photosOf(user: TestUser, query = ''): Promise<JournalPhotoPage> {
    const response = await call('GET', `/v1/journal/photos${query}`, user)
    expect(response.statusCode).toBe(200)
    return response.json<JournalPhotoPage>()
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser()
    bruno = await createTestUser()
    helena = await createTestUser()
    await registerProfessional(connection.db, helena.id)

    pages.beach = await page(ana, 'Praia', async (id) => {
      paths.sand = await uploadJournalImage(ana, id)
      paths.list = await uploadJournalImage(ana, id)
      return {
        body: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Dia de sol' }] },
          image(paths.sand, { width: 800, height: 1000, caption: 'Areia' }),
          {
            type: 'bulletList',
            content: [{ type: 'listItem', content: [image(paths.list)] }],
          },
        ],
        images: [paths.sand, paths.list],
      }
    })
    pages.empty = await page(ana, 'Sem fotos', () =>
      Promise.resolve({ body: [{ type: 'paragraph' }], images: [] }),
    )
    pages.sea = await page(ana, 'Mar', async (id) => {
      paths.sea = await uploadJournalImage(ana, id)
      return { body: [image(paths.sea, { caption: 'Ondas' })], images: [paths.sea] }
    })
    await page(bruno, 'Outro', async (id) => {
      paths.other = await uploadJournalImage(bruno, id)
      return { body: [image(paths.other)], images: [paths.other] }
    })
  })

  afterAll(async () => {
    for (const user of [ana, bruno, helena]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('lists every photo of the owner, newest page first and in reading order', async () => {
    const { photos, nextOffset } = await photosOf(ana)

    expect(nextOffset).toBeNull()
    expect(
      photos.map(({ entryId, entryTitle, position, path, caption, width, height }) => ({
        entryId,
        entryTitle,
        position,
        path,
        caption,
        width,
        height,
      })),
    ).toEqual([
      {
        entryId: pages.sea,
        entryTitle: 'Mar',
        position: 1,
        path: paths.sea,
        caption: 'Ondas',
        width: null,
        height: null,
      },
      {
        entryId: pages.beach,
        entryTitle: 'Praia',
        position: 1,
        path: paths.sand,
        caption: 'Areia',
        width: 800,
        height: 1000,
      },
      {
        entryId: pages.beach,
        entryTitle: 'Praia',
        position: 2,
        path: paths.list,
        caption: '',
        width: null,
        height: null,
      },
    ])
    const [first] = photos
    expect((await fetch(first?.url ?? '')).status).toBe(200)
  })

  it('pages through the photos', async () => {
    const first = await photosOf(ana, '?limit=2')
    const rest = await photosOf(ana, `?limit=2&offset=${String(first.nextOffset)}`)

    expect(first.photos.map((photo) => photo.path)).toEqual([paths.sea, paths.sand])
    expect(first.nextOffset).toBe(2)
    expect(rest.photos.map((photo) => photo.path)).toEqual([paths.list])
    expect(rest.nextOffset).toBeNull()
  })

  it('shows each person only their own photos and keeps professionals out', async () => {
    expect((await photosOf(bruno)).photos.map((photo) => photo.path)).toEqual([paths.other])
    expect((await call('GET', '/v1/journal/photos', helena)).statusCode).toBe(403)
    expect((await call('GET', '/v1/journal/photos?limit=500', ana)).statusCode).toBe(400)
  })
})
