import type { FastifyBaseLogger } from 'fastify'
import { Redis } from 'ioredis'

export interface RateLimit {
  limit: number
  windowSeconds: number
}

export interface RateLimiter {
  consume(key: string, rule: RateLimit): Promise<boolean>
  close(): Promise<void>
}

const unlimited: RateLimiter = {
  consume: () => Promise.resolve(true),
  close: () => Promise.resolve(),
}

export function createRateLimiter(
  redisUrl: string | null,
  log: Pick<FastifyBaseLogger, 'error'>,
): RateLimiter {
  if (redisUrl === null) {
    return unlimited
  }
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, family: 0 })
  return {
    async consume(key, { limit, windowSeconds }) {
      try {
        const results = await redis
          .multi()
          .set(`rate:${key}`, 0, 'EX', windowSeconds, 'NX')
          .incr(`rate:${key}`)
          .exec()
        const count = results?.[1]?.[1]
        return typeof count !== 'number' || count <= limit
      } catch (error) {
        log.error({ err: error }, 'Rate limit was not checked')
        return true
      }
    },
    async close() {
      await redis.quit()
    },
  }
}
