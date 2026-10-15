import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals'
import { avatarBucket, avatarMaxBytes, isOwnAvatarPath } from '@mycogni/domain'
import { z } from 'zod'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { Fetcher } from '../../src/modules/profile/photo-download.ts'
import { providerPhotoMarker } from '../../src/modules/profile/provider-photo.service.ts'
import type { App } from '../../src/shared/http.ts'
import { addGoogleIdentity, testDatabaseUrl } from '../support/database.ts'
import { downloadAs, storedFiles, tinyPng, uploadAvatar } from '../support/storage.ts'
import {
  bearer,
  createTestUser,
  deleteTestUser,
  readAppMetadata,
  type TestUser,
} from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

const googlePicture = 'https://lh3.googleusercontent.com/a/ACg8ocProviderPhoto=s96-c'
const requestedPicture = 'https://lh3.googleusercontent.com/a/ACg8ocProviderPhoto=s512-c'

const importSchema = z.object({ status: z.enum(['imported', 'skipped', 'unavailable']) })
const profileSchema = z.object({ avatarPath: z.string().nullable() })

type Reply = () => Response | Promise<Response>

function photoReply(
  body: ConstructorParameters<typeof Response>[0],
  headers: Record<string, string> = {},
): Reply {
  return () => new Response(body, { headers: { 'content-type': 'image/png', ...headers } })
}

function oversizedStream(): ReadableStream<Uint8Array> {
  const chunk = new Uint8Array(1024 * 1024)
  chunk.set(tinyPng)
  let sent = 0
  return new ReadableStream({
    pull(controller) {
      if (sent > avatarMaxBytes) {
        controller.close()
        return
      }
      controller.enqueue(chunk)
      sent += chunk.byteLength
    },
  })
}

describe('profile photo from the sign-in provider', () => {
  let app: App
  let connection: DatabaseConnection
  let reply: Reply
  const requests: { url: string; init: RequestInit }[] = []
  const users: TestUser[] = []

  const fetcher: Fetcher = async (url, init) => {
    requests.push({ url, init })
    return reply()
  }

  async function person(picture: string | null = googlePicture): Promise<TestUser> {
    const user = await createTestUser()
    users.push(user)
    if (picture !== null) {
      await addGoogleIdentity(connection.db, user.id, picture)
    }
    return user
  }

  async function importPhoto(user: TestUser) {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/me/photo/import',
      headers: bearer(user),
    })
    expect(response.statusCode).toBe(200)
    return importSchema.parse(response.json()).status
  }

  async function avatarOf(user: TestUser): Promise<string | null> {
    const response = await app.inject({ method: 'GET', url: '/v1/me', headers: bearer(user) })
    return profileSchema.parse(response.json()).avatarPath
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({
      db: connection.db,
      verifier: supabaseVerifier(),
      photoFetcher: fetcher,
    })
    await app.ready()
  })

  beforeEach(() => {
    requests.length = 0
    reply = photoReply(tinyPng)
  })

  afterAll(async () => {
    for (const user of users) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('stores the Google photo as the profile photo of someone without one', async () => {
    const user = await person()

    expect(await importPhoto(user)).toBe('imported')

    const path = await avatarOf(user)
    expect(path).not.toBeNull()
    expect(isOwnAvatarPath(path ?? '', user.id)).toBe(true)
    expect(requests).toHaveLength(1)
    expect(requests[0]?.url).toBe(requestedPicture)
    expect(requests[0]?.init.redirect).toBe('error')
    const stored = await downloadAs(user, avatarBucket, path ?? '')
    expect(Buffer.from(await stored.arrayBuffer()).equals(tinyPng)).toBe(true)
    expect(await readAppMetadata(user.id)).toHaveProperty(providerPhotoMarker)
  })

  it('imports only once, and not again after the person removes the photo', async () => {
    const user = await person()
    await importPhoto(user)
    const path = await avatarOf(user)

    expect(await importPhoto(user)).toBe('skipped')
    expect(await avatarOf(user)).toBe(path)
    expect(await storedFiles(avatarBucket, user.id)).toHaveLength(1)

    await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(user),
      payload: { avatarPath: null },
    })

    expect(await importPhoto(user)).toBe('skipped')
    expect(await avatarOf(user)).toBeNull()
    expect(requests).toHaveLength(1)
  })

  it('never replaces a photo the person chose', async () => {
    const user = await person()
    const chosen = await uploadAvatar(user)
    await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(user),
      payload: { avatarPath: chosen },
    })

    expect(await importPhoto(user)).toBe('skipped')
    expect(await avatarOf(user)).toBe(chosen)
    expect(requests).toHaveLength(0)
  })

  it('downloads nothing from hosts outside Google or over plain http', async () => {
    const elsewhere = await person('https://example.org/a/ACg8ocProviderPhoto=s96-c')
    const insecure = await person('http://lh3.googleusercontent.com/a/ACg8ocProviderPhoto')

    expect(await importPhoto(elsewhere)).toBe('unavailable')
    expect(await importPhoto(insecure)).toBe('unavailable')
    expect(await avatarOf(elsewhere)).toBeNull()
    expect(await avatarOf(insecure)).toBeNull()
    expect(requests).toHaveLength(0)
  })

  it('does nothing for someone who did not sign in with Google', async () => {
    const user = await person(null)

    expect(await importPhoto(user)).toBe('unavailable')
    expect(requests).toHaveLength(0)
  })

  it('refuses photos over 5 MB, whether announced or streamed', async () => {
    const announced = await person()
    const streamed = await person()

    reply = photoReply(tinyPng, { 'content-length': String(avatarMaxBytes + 1) })
    expect(await importPhoto(announced)).toBe('unavailable')
    reply = photoReply(oversizedStream())
    expect(await importPhoto(streamed)).toBe('unavailable')

    expect(await avatarOf(announced)).toBeNull()
    expect(await avatarOf(streamed)).toBeNull()
    expect(await storedFiles(avatarBucket, streamed.id)).toEqual([])
  })

  it('refuses files that are not JPG, PNG or WebP images', async () => {
    const gif = await person()
    const disguised = await person()

    reply = photoReply(tinyPng, { 'content-type': 'image/gif' })
    expect(await importPhoto(gif)).toBe('unavailable')
    reply = photoReply('<html><script>alert(1)</script></html>')
    expect(await importPhoto(disguised)).toBe('unavailable')

    expect(await avatarOf(gif)).toBeNull()
    expect(await avatarOf(disguised)).toBeNull()
  })

  it('tries again on a later sign-in when Google could not be reached', async () => {
    const user = await person()

    reply = () => Promise.reject(new Error('timeout'))
    expect(await importPhoto(user)).toBe('unavailable')
    reply = photoReply(tinyPng)
    expect(await importPhoto(user)).toBe('imported')
    expect(await avatarOf(user)).not.toBeNull()
  })

  it('needs a signed-in person', async () => {
    const response = await app.inject({ method: 'POST', url: '/v1/me/photo/import' })

    expect(response.statusCode).toBe(401)
  })
})
