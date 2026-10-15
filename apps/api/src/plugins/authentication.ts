import type { FastifyRequest } from 'fastify'
import type { AuthenticatedUser, TokenVerifier } from '../auth/token-verifier.ts'
import { UnauthorizedError } from '../shared/errors.ts'
import type { App } from '../shared/http.ts'

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser | null
  }
}

const bearerPrefix = 'Bearer '

function bearerToken(request: FastifyRequest): string {
  const header = request.headers.authorization
  if (header?.startsWith(bearerPrefix) !== true) {
    throw new UnauthorizedError()
  }
  return header.slice(bearerPrefix.length)
}

export function requireAuthentication(app: App, verifier: TokenVerifier): void {
  app.decorateRequest('user', null)
  app.addHook('onRequest', async (request) => {
    const token = bearerToken(request)
    try {
      request.user = await verifier.verify(token)
    } catch {
      throw new UnauthorizedError('Invalid or expired session')
    }
  })
}

export function currentUser(request: FastifyRequest): AuthenticatedUser {
  if (request.user === null) {
    throw new UnauthorizedError()
  }
  return request.user
}
