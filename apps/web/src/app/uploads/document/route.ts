import {
  isProfessionalDocumentType,
  professionalDocumentBucket,
  professionalDocumentExtension,
  professionalDocumentName,
  professionalDocumentProblem,
  sniffDocumentType,
} from '@mycogni/domain'
import { NextResponse } from 'next/server'
import { submitProfessionalDocument } from '@/shared/lib/api/care'
import { currentUser } from '@/shared/lib/auth/session'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { fileHead } from '@/shared/lib/file-head'
import { refuse, refuseFile } from '@/shared/lib/upload-responses'

export async function POST(request: Request) {
  const user = await currentUser()
  if (user === null) {
    return refuse(401, 'UNAUTHORIZED')
  }
  const form = await request.formData().catch(() => null)
  const file = form?.get('document')
  if (!(file instanceof File)) {
    return refuse(400, 'NO_FILE')
  }
  if (!isProfessionalDocumentType(file.type)) {
    return refuseFile('type')
  }
  const problem = professionalDocumentProblem(file)
  if (problem !== null) {
    return refuseFile(problem)
  }
  if (sniffDocumentType(await fileHead(file)) !== file.type) {
    return refuseFile('type')
  }
  const path = `${user.id}/${crypto.randomUUID()}.${professionalDocumentExtension(file.type)}`
  const storage = (await createSupabaseServerClient('read-write')).storage.from(
    professionalDocumentBucket,
  )
  const uploaded = await storage.upload(path, file, { contentType: file.type })
  if (uploaded.error !== null) {
    console.error(uploaded.error)
    return refuse(502, 'UPLOAD_FAILED')
  }
  try {
    await submitProfessionalDocument({
      path,
      fileName: professionalDocumentName(file.name, file.type),
      contentType: file.type,
      sizeBytes: file.size,
    })
  } catch (error) {
    console.error(error)
    await storage.remove([path])
    return refuse(502, 'SAVE_FAILED')
  }
  return new NextResponse(null, { status: 204 })
}
