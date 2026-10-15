import { Queue } from 'bullmq'
import type { FastifyBaseLogger } from 'fastify'
import { createRedis, insightQueueName } from './redis.ts'

export interface JobScheduler {
  checkInRecorded(patientId: string): Promise<void>
  close(): Promise<void>
}

const batchingDelayMs = 60_000

const idleScheduler: JobScheduler = {
  checkInRecorded: () => Promise.resolve(),
  close: () => Promise.resolve(),
}

export function createJobScheduler(
  redisUrl: string | null,
  log: Pick<FastifyBaseLogger, 'error'>,
): JobScheduler {
  if (redisUrl === null) {
    return idleScheduler
  }
  const redis = createRedis(redisUrl)
  const queue = new Queue(insightQueueName, { connection: redis })
  return {
    async checkInRecorded(patientId) {
      try {
        await queue.add(
          'check-in-recorded',
          { patientId },
          {
            jobId: `insight-${patientId}`,
            delay: batchingDelayMs,
            removeOnComplete: true,
            removeOnFail: 100,
            attempts: 3,
            backoff: { type: 'exponential', delay: 30_000 },
          },
        )
      } catch (error) {
        log.error({ err: error }, 'Insight job was not scheduled')
      }
    },
    async close() {
      await queue.close()
      await redis.quit()
    },
  }
}
