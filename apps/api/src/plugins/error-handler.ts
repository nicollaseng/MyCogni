import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import { AppError } from '../shared/errors.ts'
import type { App, ErrorBody } from '../shared/http.ts'

const internalError: ErrorBody = { code: 'INTERNAL_ERROR', message: 'Internal server error' }

function statusCodeOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return undefined
  }
  return typeof error.statusCode === 'number' ? error.statusCode : undefined
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Bad request'
}

export function registerErrorHandler(app: App): void {
  app.setNotFoundHandler((request, reply) => {
    const body: ErrorBody = {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
    }
    return reply.status(404).send(body)
  })

  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      const body: ErrorBody = {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        issues: error.validation.map((issue) => ({
          location: error.validationContext ?? 'request',
          path: issue.instancePath,
          message: issue.message ?? 'Invalid value',
        })),
      }
      return reply.status(400).send(body)
    }

    if (error instanceof AppError) {
      const body: ErrorBody = { code: error.code, message: error.message }
      return reply.status(error.statusCode).send(body)
    }

    const statusCode = statusCodeOf(error)
    if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
      const body: ErrorBody = { code: 'BAD_REQUEST', message: messageOf(error) }
      return reply.status(statusCode).send(body)
    }

    request.log.error({ err: error }, 'Unhandled error')
    return reply.status(500).send(internalError)
  })
}
