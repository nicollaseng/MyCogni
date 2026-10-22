import {
  avatarBucket,
  avatarExtension,
  avatarProblem,
  isAvatarType,
  sniffAvatarType,
} from '@mycogni/domain'
import { NextResponse } from 'next/server'
import { ApiError } from '@/shared/lib/api/client'
import { fetchProfile, updateProfile } from '@/shared/lib/api/resources'
import { currentUser } from '@/shared/lib/auth/session'
import { ownPhotoUrl } from '@/shared/lib/photos'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { fileHead } from '@/shared/lib/file-head'
import { refuse, refuseFile } from '@/shared/lib/upload-responses'

const oneYearSeconds = String(60 * 60 * 24 * 365)

async function photoStorage() {
  return (await createSupabaseServerClient('read-write')).storage.from(avatarBucket)
}

function refusedSave(error: unknown): NextResponse {
  if (error instanceof ApiError && error.code === 'IDENTITY_LOCKED') {
    return refuse(409, 'IDENTITY_LOCKED')
  }
  console.error(error)
  return refuse(502, 'SAVE_FAILED')
}

export async function POST(request: Request) {
  const user = await currentUser()
  if (user === null) {
    return refuse(401, 'UNAUTHORIZED')
  }
  const form = await request.formData().catch(() => null)
  const file = form?.get('photo')
  if (!(file instanceof File)) {
    return refuse(400, 'NO_FILE')
  }
  if (!isAvatarType(file.type)) {
    return refuseFile('type')
  }
  const problem = avatarProblem(file)
  if (problem !== null) {
    return refuseFile(problem)
  }
  if (sniffAvatarType(await fileHead(file)) !== file.type) {
    return refuseFile('type')
  }
  const path = `${user.id}/${crypto.randomUUID()}.${avatarExtension(file.type)}`
  const storage = await photoStorage()
  const uploaded = await storage.upload(path, file, {
    contentType: file.type,
    cacheControl: oneYearSeconds,
  })
  if (uploaded.error !== null) {
    console.error(uploaded.error)
    return refuse(502, 'UPLOAD_FAILED')
  }
  try {
    const previous = (await fetchProfile()).avatarPath
    await updateProfile({ avatarPath: path })
    if (previous !== null) {
      await storage.remove([previous])
    }
  } catch (error) {
    await storage.remove([path])
    return refusedSave(error)
  }
  return NextResponse.json({ url: await ownPhotoUrl(path) }, { status: 201 })
}

export async function DELETE() {
  if ((await currentUser()) === null) {
    return refuse(401, 'UNAUTHORIZED')
  }
  try {
    const { avatarPath } = await fetchProfile()
    if (avatarPath !== null) {
      await updateProfile({ avatarPath: null })
      await (await photoStorage()).remove([avatarPath])
    }
  } catch (error) {
    return refusedSave(error)
  }
  return new NextResponse(null, { status: 204 })
}
