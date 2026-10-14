import { beforeAll, describe, expect, it } from '@jest/globals'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type CryptoKey } from 'jose'
import { createTokenVerifier, type TokenVerifier } from '../../src/auth/token-verifier.ts'

const issuer = 'http://127.0.0.1:55321/auth/v1'
const userId = '6f1c7a52-6a0e-4f7d-9e2b-0c2a4e9a1b11'

describe('token verifier', () => {
  let privateKey: CryptoKey
  let verifier: TokenVerifier

  function token(claims: Record<string, string> = {}) {
    return new SignJWT({ email: 'ana@example.com', ...claims })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
      .setSubject(userId)
      .setIssuer(issuer)
      .setAudience('authenticated')
      .setIssuedAt()
      .setExpirationTime('5m')
  }

  beforeAll(async () => {
    const keys = await generateKeyPair('ES256')
    privateKey = keys.privateKey
    const publicJwk = { ...(await exportJWK(keys.publicKey)), kid: 'test-key', alg: 'ES256' }
    verifier = createTokenVerifier({ keys: createLocalJWKSet({ keys: [publicJwk] }), issuer })
  })

  it('accepts a token signed by the auth server and returns who it belongs to', async () => {
    const user = await verifier.verify(await token().sign(privateKey))

    expect(user).toEqual({ id: userId, email: 'ana@example.com' })
  })

  it('rejects a token from another issuer', async () => {
    const forged = await token().setIssuer('https://evil.example.com/auth/v1').sign(privateKey)

    await expect(verifier.verify(forged)).rejects.toThrow()
  })

  it('rejects a token meant for another audience', async () => {
    const forged = await token().setAudience('anon').sign(privateKey)

    await expect(verifier.verify(forged)).rejects.toThrow()
  })

  it('rejects an expired token', async () => {
    const expired = await token()
      .setIssuedAt(Math.floor(Date.now() / 1000) - 600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 300)
      .sign(privateKey)

    await expect(verifier.verify(expired)).rejects.toThrow()
  })

  it('rejects a token signed by another key', async () => {
    const stranger = await generateKeyPair('ES256')
    const forged = await token().sign(stranger.privateKey)

    await expect(verifier.verify(forged)).rejects.toThrow()
  })

  it('rejects anything that is not a token', async () => {
    await expect(verifier.verify('not-a-token')).rejects.toThrow()
  })
})
