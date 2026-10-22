import { createHmac, timingSafeEqual } from 'node:crypto'

const purpose = 'reminder-email-off'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export interface UnsubscribeTokens {
  sign(userId: string): string
  verify(token: string): string | null
}

export function createUnsubscribeTokens(secret: string): UnsubscribeTokens {
  const key = createHmac('sha256', secret).update(purpose).digest()

  function signatureOf(userId: string): Buffer {
    return createHmac('sha256', key).update(`${purpose}:${userId}`).digest()
  }

  return {
    sign(userId) {
      return `${userId}.${signatureOf(userId).toString('base64url')}`
    },
    verify(token) {
      const [userId, signature, ...rest] = token.split('.')
      if (userId === undefined || signature === undefined || rest.length > 0) {
        return null
      }
      if (!uuidPattern.test(userId)) {
        return null
      }
      const given = Buffer.from(signature, 'base64url')
      const expected = signatureOf(userId)
      return given.length === expected.length && timingSafeEqual(given, expected) ? userId : null
    },
  }
}
