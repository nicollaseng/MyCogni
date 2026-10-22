import { transcriptionSchema } from '@mycogni/contracts'
import { locales, voiceLimits } from '@mycogni/domain'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { TranscriptionService } from './transcription.service.ts'

const transcriptionQuery = z.object({ locale: z.enum(locales) })

export function transcriptionRoutes(service: TranscriptionService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.addContentTypeParser(
      /^audio\//,
      { parseAs: 'buffer', bodyLimit: voiceLimits.maxBytes },
      (_request, body, parsed) => {
        parsed(null, body)
      },
    )
    app.post(
      '/assistant/transcriptions',
      {
        bodyLimit: voiceLimits.maxBytes,
        schema: { querystring: transcriptionQuery, response: { 200: transcriptionSchema } },
      },
      (request) =>
        service.transcribe(currentUser(request), {
          audio: request.body,
          contentType: request.headers['content-type'],
          locale: request.query.locale,
        }),
    )
    done()
  }
}
