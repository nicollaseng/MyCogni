import { isLocale, voiceAudioTypeOf, voiceLimits } from '@mycogni/domain'
import { NextResponse } from 'next/server'
import { getLocale } from 'next-intl/server'
import { transcribeVoice } from '@/shared/lib/api/assistant'
import { ApiError } from '@/shared/lib/api/client'
import { currentUser } from '@/shared/lib/auth/session'
import { refuse, refuseFile } from '@/shared/lib/upload-responses'

const passedOn: readonly number[] = [413, 415, 429, 503]

function apiFailure(error: unknown): NextResponse {
  if (error instanceof ApiError && passedOn.includes(error.status)) {
    return refuse(error.status, error.code)
  }
  console.error(error instanceof ApiError ? error.code : 'Voice message was not transcribed')
  return refuse(502, 'VOICE_FAILED')
}

export async function POST(request: Request) {
  if ((await currentUser()) === null) {
    return refuse(401, 'UNAUTHORIZED')
  }
  const contentType = request.headers.get('content-type')
  if (voiceAudioTypeOf(contentType) === null || contentType === null) {
    return refuseFile('type')
  }
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > voiceLimits.maxBytes) {
    return refuseFile('size')
  }
  const audio = await request.arrayBuffer().catch(() => null)
  if (audio === null || audio.byteLength === 0) {
    return refuse(400, 'VOICE_EMPTY')
  }
  if (audio.byteLength > voiceLimits.maxBytes) {
    return refuseFile('size')
  }
  const locale = await getLocale()
  try {
    const { text } = await transcribeVoice(audio, contentType, isLocale(locale) ? locale : 'en-US')
    return NextResponse.json({ text })
  } catch (error) {
    return apiFailure(error)
  }
}
