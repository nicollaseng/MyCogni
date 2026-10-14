import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'
import { UnauthorizedError } from '../shared/errors.ts'

export interface AuthenticatedUser {
  id: string
  email: string | null
}

export interface TokenVerifier {
  verify(token: string): Promise<AuthenticatedUser>
}

interface VerifierOptions {
  keys: JWTVerifyGetKey
  issuer: string
}

const audience = 'authenticated'

export function createTokenVerifier({ keys, issuer }: VerifierOptions): TokenVerifier {
  return {
    async verify(token) {
      const { payload } = await jwtVerify(token, keys, { issuer, audience })
      if (typeof payload.sub !== 'string' || payload.sub === '') {
        throw new UnauthorizedError('Token without subject')
      }
      return {
        id: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : null,
      }
    },
  }
}

export function supabaseIssuer(supabaseUrl: string): string {
  return `${supabaseUrl}/auth/v1`
}

export function createSupabaseTokenVerifier(supabaseUrl: string): TokenVerifier {
  const issuer = supabaseIssuer(supabaseUrl)
  return createTokenVerifier({
    keys: createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`)),
    issuer,
  })
}
