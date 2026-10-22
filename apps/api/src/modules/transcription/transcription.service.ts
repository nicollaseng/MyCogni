import type { Transcription } from '@mycogni/contracts'
import {
  assistantLimits,
  transcriptionLanguageOf,
  voiceAudioTypeOf,
  voiceLimits,
  type Locale,
} from '@mycogni/domain'
import { TranscriptionFailedError, type Transcriber } from '../../ai/transcriber.ts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import {
  AppError,
  BadGatewayError,
  PayloadTooLargeError,
  ServiceUnavailableError,
  TooManyRequestsError,
  UnsupportedMediaTypeError,
} from '../../shared/errors.ts'
import type { RateLimiter } from '../../shared/rate-limiter.ts'

export interface TranscriptionLog {
  error(details: object, message: string): void
}

export interface VoiceMessage {
  audio: unknown
  contentType: string | undefined
  locale: Locale
}

export interface TranscriptionService {
  transcribe(user: AuthenticatedUser, message: VoiceMessage): Promise<Transcription>
}

interface TranscriptionDependencies {
  transcriber: Transcriber | null
  limiter: RateLimiter
  log: TranscriptionLog
}

const hourSeconds = 60 * 60

const daySeconds = 24 * hourSeconds

export function fitToMessage(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  const max = assistantLimits.messageLength
  if (clean.length <= max) {
    return clean
  }
  const cut = clean.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return (space > max * 0.8 ? cut.slice(0, space) : cut).trim()
}

export function createTranscriptionService({
  transcriber,
  limiter,
  log,
}: TranscriptionDependencies): TranscriptionService {
  async function withinLimits(user: AuthenticatedUser): Promise<boolean> {
    const hourly = await limiter.consume(`voice:hour:${user.id}`, {
      limit: voiceLimits.hourlyTranscriptions,
      windowSeconds: hourSeconds,
    })
    return (
      hourly &&
      limiter.consume(`voice:day:${user.id}`, {
        limit: voiceLimits.dailyTranscriptions,
        windowSeconds: daySeconds,
      })
    )
  }

  return {
    async transcribe(user, { audio, contentType, locale }) {
      if (transcriber === null) {
        throw new ServiceUnavailableError('VOICE_UNAVAILABLE', 'Voice messages are not available')
      }
      const type = voiceAudioTypeOf(contentType)
      if (type === null || !Buffer.isBuffer(audio)) {
        throw new UnsupportedMediaTypeError('VOICE_TYPE', 'Send the voice message as audio')
      }
      if (audio.length === 0) {
        throw new AppError(400, 'VOICE_EMPTY', 'The voice message is empty')
      }
      if (audio.length > voiceLimits.maxBytes) {
        throw new PayloadTooLargeError('VOICE_TOO_LARGE', 'The voice message is too long')
      }
      if (!(await withinLimits(user))) {
        throw new TooManyRequestsError('VOICE_LIMIT', 'Too many voice messages for now')
      }
      try {
        const text = await transcriber.transcribe({
          audio,
          type,
          language: transcriptionLanguageOf(locale),
        })
        return { text: fitToMessage(text) }
      } catch (error) {
        log.error(
          {
            error: error instanceof Error ? error.name : 'unknown',
            status: error instanceof TranscriptionFailedError ? error.status : null,
          },
          'Voice message was not transcribed',
        )
        throw new BadGatewayError('VOICE_FAILED', 'The voice message could not be transcribed')
      }
    },
  }
}
