import { randomUUID } from 'node:crypto'
import { journalBucket } from '@mycogni/domain'
import { testSupabaseUrl, type TestUser } from './supabase.ts'

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

export async function uploadJournalImage(user: TestUser, entryId: string): Promise<string> {
  const path = `${user.id}/${entryId}/${randomUUID()}.png`
  const response = await fetch(`${testSupabaseUrl}/storage/v1/object/${journalBucket}/${path}`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY ?? '',
      authorization: `Bearer ${user.accessToken}`,
      'content-type': 'image/png',
    },
    body: tinyPng,
  })
  if (!response.ok) {
    throw new Error(`Upload answered ${String(response.status)}: ${await response.text()}`)
  }
  return path
}
