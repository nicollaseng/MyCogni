import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/shared/lib/api/client'
import { deleteMemory } from '@/shared/lib/api/memories'
import { currentUser } from '@/shared/lib/auth/session'
import { refuse } from '@/shared/lib/upload-responses'

export async function DELETE(_request: Request, { params }: RouteContext<'/me/memories/[id]'>) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) {
    return refuse(404, 'NOT_FOUND')
  }
  if ((await currentUser()) === null) {
    return refuse(401, 'UNAUTHORIZED')
  }
  try {
    await deleteMemory(id)
  } catch (cause) {
    if (!(cause instanceof ApiError && cause.status === 404)) {
      console.error(cause)
      return refuse(502, 'API_FAILED')
    }
  }
  revalidatePath('/me', 'layout')
  return new NextResponse(null, { status: 204 })
}
