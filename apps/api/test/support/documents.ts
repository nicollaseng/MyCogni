import type { App } from '../../src/shared/http.ts'
import { tinyPdf, uploadAvatar, uploadProfessionalDocument } from './storage.ts'
import { bearer, type TestUser } from './supabase.ts'

export async function sendRegistrationDocument(app: App, user: TestUser, fileName = 'CRP.pdf') {
  const path = await uploadProfessionalDocument(user)
  return app.inject({
    method: 'POST',
    url: '/v1/professional/documents',
    headers: bearer(user),
    payload: { path, fileName, contentType: 'application/pdf', sizeBytes: tinyPdf.length },
  })
}

export async function addProfilePhoto(app: App, user: TestUser): Promise<string> {
  const path = await uploadAvatar(user)
  const response = await app.inject({
    method: 'PATCH',
    url: '/v1/me',
    headers: bearer(user),
    payload: { avatarPath: path },
  })
  if (response.statusCode !== 200) {
    throw new Error(`The photo was not saved: ${response.body}`)
  }
  return path
}
