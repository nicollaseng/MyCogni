import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Transcriber } from '../../ai/transcriber.ts'
import type { RateLimiter } from '../../shared/rate-limiter.ts'
import { transcriptionRoutes } from './transcription.routes.ts'
import { createTranscriptionService, type TranscriptionLog } from './transcription.service.ts'

export interface TranscriptionModuleOptions {
  transcriber: Transcriber | null
  limiter: RateLimiter
  log: TranscriptionLog
}

export function transcriptionModule(options: TranscriptionModuleOptions): FastifyPluginCallbackZod {
  return transcriptionRoutes(createTranscriptionService(options))
}
