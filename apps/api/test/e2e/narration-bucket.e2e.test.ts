import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { narrationBucket } from '@mycogni/domain'
import { createNarrationStore } from '../../src/narration/narration-store.ts'
import { uploadAs } from '../support/storage.ts'
import {
  createTestUser,
  deleteTestUser,
  testSupabaseUrl,
  type TestUser,
} from '../support/supabase.ts'

const audio = Buffer.from([73, 68, 51, 4, 0, 0, 0, 0, 0, 0])

function secretKey(): string {
  return process.env.SUPABASE_SECRET_KEY ?? ''
}

function publicUrl(path: string): string {
  return `${testSupabaseUrl}/storage/v1/object/public/${narrationBucket}/${path}`
}

describe('narration bucket', () => {
  let person: TestUser
  const path = `en/jessica/test-${randomUUID()}-0123456789abcdef.mp3`

  beforeAll(async () => {
    person = await createTestUser()
  })

  afterAll(async () => {
    await fetch(`${testSupabaseUrl}/storage/v1/object/${narrationBucket}`, {
      method: 'DELETE',
      headers: {
        apikey: secretKey(),
        authorization: `Bearer ${secretKey()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ prefixes: [path] }),
    })
    await deleteTestUser(person.id)
  })

  it('lets the server publish narration that anyone can play, cached for a year', async () => {
    const store = createNarrationStore({
      supabaseUrl: testSupabaseUrl,
      secretKey: secretKey(),
    })
    await store.upload(path, Uint8Array.from(audio))

    const response = await fetch(publicUrl(path))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('audio/mpeg')
    expect(response.headers.get('cache-control')).toContain('max-age=31536000')
    expect(Buffer.from(await response.arrayBuffer())).toEqual(audio)
  })

  it('refuses uploads from people and visitors', async () => {
    const asPerson = await uploadAs(
      person,
      narrationBucket,
      `en/jessica/${randomUUID()}.mp3`,
      'audio/mpeg',
      audio,
    )
    expect(asPerson.ok).toBe(false)

    const asVisitor = await fetch(
      `${testSupabaseUrl}/storage/v1/object/${narrationBucket}/en/jessica/${randomUUID()}.mp3`,
      {
        method: 'POST',
        headers: { apikey: process.env.SUPABASE_ANON_KEY ?? '', 'content-type': 'audio/mpeg' },
        body: audio,
      },
    )
    expect(asVisitor.ok).toBe(false)
  })

  it('refuses files that are not audio or the manifest', async () => {
    const response = await fetch(
      `${testSupabaseUrl}/storage/v1/object/${narrationBucket}/en/jessica/${randomUUID()}.html`,
      {
        method: 'POST',
        headers: {
          apikey: secretKey(),
          authorization: `Bearer ${secretKey()}`,
          'content-type': 'text/html',
        },
        body: '<p>no</p>',
      },
    )
    expect(response.ok).toBe(false)
  })
})
