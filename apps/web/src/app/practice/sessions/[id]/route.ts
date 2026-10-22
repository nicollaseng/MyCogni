import { zenSessionFeelingSchema } from '@mycogni/contracts'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/shared/lib/api/client'
import { rememberZenFeeling } from '@/shared/lib/api/zen'
import { currentUser } from '@/shared/lib/auth/session'
import { refuse } from '@/shared/lib/upload-responses'

export async function PATCH(request: Request, { params }: RouteContext<'/practice/sessions/[id]'>) {
  if ((await currentUser()) === null) {
    return refuse(401, 'UNAUTHORIZED')
  }
  const id = z.uuid().safeParse((await params).id)
  const body = zenSessionFeelingSchema.safeParse(await request.json().catch(() => null))
  if (!id.success || !body.success) {
    return refuse(400, 'INVALID')
  }
  try {
    await rememberZenFeeling(id.data, body.data.feelingAfter)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) {
      return refuse(error.status, error.code)
    }
    console.error(error instanceof ApiError ? error.code : 'Zen feeling was not saved')
    return refuse(502, 'SAVE_FAILED')
  }
}
