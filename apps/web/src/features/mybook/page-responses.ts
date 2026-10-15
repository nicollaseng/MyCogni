import type { NextResponse } from 'next/server'
import { ApiError } from '@/shared/lib/api/client'
import { currentUser } from '@/shared/lib/auth/session'
import { refuse } from '@/shared/lib/upload-responses'
import { outdatedClientCode, pageClientHeader, pageClientVersion } from './page-client'

const passedThrough: ReadonlySet<number> = new Set([401, 404])

const invalid: ReadonlySet<number> = new Set([400, 422])

export async function pageRequestRefusal(request: Request): Promise<NextResponse | null> {
  if (request.headers.get(pageClientHeader) !== pageClientVersion) {
    return refuse(409, outdatedClientCode)
  }
  return (await currentUser()) === null ? refuse(401, 'UNAUTHORIZED') : null
}

export function pageApiRefusal(cause: unknown): NextResponse {
  if (cause instanceof ApiError && passedThrough.has(cause.status)) {
    return refuse(cause.status, cause.code)
  }
  if (cause instanceof ApiError && invalid.has(cause.status)) {
    return refuse(422, 'INVALID_CONTENT')
  }
  console.error(cause)
  return refuse(502, 'API_FAILED')
}
