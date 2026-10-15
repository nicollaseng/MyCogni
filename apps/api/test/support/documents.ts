import type { App } from '../../src/shared/http.ts'
import { tinyPdf, uploadProfessionalDocument } from './storage.ts'
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
