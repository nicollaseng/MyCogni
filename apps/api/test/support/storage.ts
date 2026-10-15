import { randomUUID } from 'node:crypto'
import { avatarBucket, journalBucket, professionalDocumentBucket } from '@mycogni/domain'
import { testSupabaseUrl, type TestUser } from './supabase.ts'

export const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

export const tinyPdf = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
)

function objectUrl(bucket: string, path: string): string {
  return `${testSupabaseUrl}/storage/v1/object/${bucket}/${path}`
}

export function uploadAs(
  user: TestUser,
  bucket: string,
  path: string,
  contentType: string,
  body: Buffer,
): Promise<Response> {
  return fetch(objectUrl(bucket, path), {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY ?? '',
      authorization: `Bearer ${user.accessToken}`,
      'content-type': contentType,
    },
    body,
  })
}

export function downloadAs(user: TestUser, bucket: string, path: string): Promise<Response> {
  return fetch(`${testSupabaseUrl}/storage/v1/object/authenticated/${bucket}/${path}`, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY ?? '',
      authorization: `Bearer ${user.accessToken}`,
    },
  })
}

async function uploaded(
  user: TestUser,
  bucket: string,
  path: string,
  contentType: string,
  body: Buffer,
): Promise<string> {
  const response = await uploadAs(user, bucket, path, contentType, body)
  if (!response.ok) {
    throw new Error(`Upload answered ${String(response.status)}: ${await response.text()}`)
  }
  return path
}

export function uploadJournalImage(user: TestUser, entryId: string): Promise<string> {
  return uploaded(
    user,
    journalBucket,
    `${user.id}/${entryId}/${randomUUID()}.png`,
    'image/png',
    tinyPng,
  )
}

export function uploadAvatar(user: TestUser): Promise<string> {
  return uploaded(user, avatarBucket, `${user.id}/${randomUUID()}.png`, 'image/png', tinyPng)
}

export function uploadProfessionalDocument(user: TestUser): Promise<string> {
  return uploaded(
    user,
    professionalDocumentBucket,
    `${user.id}/${randomUUID()}.pdf`,
    'application/pdf',
    tinyPdf,
  )
}

export async function storedFiles(bucket: string, folder: string): Promise<string[]> {
  const secret = process.env.SUPABASE_SECRET_KEY ?? ''
  const response = await fetch(`${testSupabaseUrl}/storage/v1/object/list/${bucket}`, {
    method: 'POST',
    headers: {
      apikey: secret,
      authorization: `Bearer ${secret}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ prefix: `${folder}/`, limit: 100 }),
  })
  const items = (await response.json()) as { name: string }[]
  return items.map((item) => item.name)
}
