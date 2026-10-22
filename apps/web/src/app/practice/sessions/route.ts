import { recordZenSessionSchema } from '@mycogni/contracts'
import { NextResponse } from 'next/server'
import { ApiError } from '@/shared/lib/api/client'
import { recordZenSession } from '@/shared/lib/api/zen'
import { currentUser } from '@/shared/lib/auth/session'
import { refuse } from '@/shared/lib/upload-responses'

export async function POST(request: Request) {
  if ((await currentUser()) === null) {
    return refuse(401, 'UNAUTHORIZED')
  }
  const parsed = recordZenSessionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return refuse(400, 'INVALID')
  }
  try {
    const session = await recordZenSession(parsed.data)
    return NextResponse.json({ id: session.id }, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) {
      return refuse(error.status, error.code)
    }
    console.error(error instanceof ApiError ? error.code : 'Zen session was not saved')
    return refuse(502, 'SAVE_FAILED')
  }
}
