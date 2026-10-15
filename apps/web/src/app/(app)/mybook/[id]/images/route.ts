import {
  isJournalImageType,
  journalBucket,
  journalImageExtension,
  journalLimits,
} from '@mycogni/domain'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { currentUser } from '@/shared/lib/auth/session'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'

const signedUrlLifetimeSeconds = 60 * 60

function refuse(status: number, code: string): NextResponse {
  return NextResponse.json({ code }, { status })
}

export async function POST(request: Request, { params }: RouteContext<'/mybook/[id]/images'>) {
  const user = await currentUser()
  if (user === null) {
    return refuse(401, 'UNAUTHORIZED')
  }
  const { id } = await params
  if (!z.uuid().safeParse(id).success) {
    return refuse(404, 'NOT_FOUND')
  }
  const form = await request.formData().catch(() => null)
  const file = form?.get('image')
  if (!(file instanceof File)) {
    return refuse(400, 'NO_IMAGE')
  }
  if (!isJournalImageType(file.type)) {
    return refuse(415, 'NOT_AN_IMAGE')
  }
  if (file.size > journalLimits.imageBytes) {
    return refuse(413, 'TOO_LARGE')
  }
  const path = `${user.id}/${id}/${crypto.randomUUID()}.${journalImageExtension(file.type)}`
  const storage = (await createSupabaseServerClient('read-write')).storage.from(journalBucket)
  const uploaded = await storage.upload(path, file, { contentType: file.type })
  if (uploaded.error !== null) {
    console.error(uploaded.error)
    return refuse(502, 'UPLOAD_FAILED')
  }
  const signed = await storage.createSignedUrl(path, signedUrlLifetimeSeconds)
  if (signed.error !== null) {
    console.error(signed.error)
    await storage.remove([path])
    return refuse(502, 'UPLOAD_FAILED')
  }
  return NextResponse.json({ path, url: signed.data.signedUrl }, { status: 201 })
}
