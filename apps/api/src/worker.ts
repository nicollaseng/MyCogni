import { Queue, Worker } from 'bullmq'
import { z } from 'zod'
import { createClaudeInsightWriter } from './ai/insight-writer.ts'
import { loadConfig } from './config/env.ts'
import { connectDatabase } from './db/client.ts'
import { expireInvitations } from './jobs/expire-invitations.ts'
import { createRedis, insightQueueName, maintenanceQueueName } from './jobs/redis.ts'
import { createAssessmentRepository } from './modules/assessments/assessment.repository.ts'
import { createCheckInRepository } from './modules/check-ins/check-in.repository.ts'
import { createInsightJob } from './modules/insights/insight-job.ts'
import { createInsightRepository } from './modules/insights/insight.repository.ts'

const config = loadConfig(process.env)
if (config.redisUrl === null) {
  console.error('REDIS_URL is required to run the worker')
  process.exit(1)
}
const redisUrl = config.redisUrl
const database = connectDatabase(config.databaseUrl)
const writer =
  config.anthropicApiKey === null ? null : createClaudeInsightWriter(config.anthropicApiKey)
const insightJob =
  writer === null
    ? null
    : createInsightJob({
        insights: createInsightRepository(database.db),
        checkIns: createCheckInRepository(database.db),
        assessments: createAssessmentRepository(database.db),
        writer,
        now: () => new Date(),
      })

const insightPayload = z.object({ patientId: z.uuid() })

const connections = [createRedis(redisUrl), createRedis(redisUrl), createRedis(redisUrl)] as const

const insightWorker = new Worker(
  insightQueueName,
  async (job) => {
    if (insightJob === null) {
      return { kind: 'skipped', reason: 'ai_disabled' }
    }
    return insightJob.run(insightPayload.parse(job.data).patientId)
  },
  { connection: connections[0], concurrency: 2 },
)

const maintenanceQueue = new Queue(maintenanceQueueName, { connection: connections[1] })
await maintenanceQueue.upsertJobScheduler(
  'expire-invitations',
  { every: 60 * 60 * 1000 },
  { name: 'expire-invitations' },
)
const maintenanceWorker = new Worker(
  maintenanceQueueName,
  async () => ({ expired: await expireInvitations(database.db) }),
  { connection: connections[2] },
)

for (const worker of [insightWorker, maintenanceWorker]) {
  worker.on('failed', (job, error) => {
    console.error(
      JSON.stringify({ level: 'error', queue: worker.name, job: job?.id, error: error.message }),
    )
  })
}

console.info(
  JSON.stringify({
    level: 'info',
    msg: 'Worker started',
    ai: writer === null ? 'disabled' : writer.model,
  }),
)

async function shutdown(): Promise<void> {
  await Promise.all([insightWorker.close(), maintenanceWorker.close(), maintenanceQueue.close()])
  await Promise.all(connections.map((connection) => connection.quit()))
  await database.close()
  process.exit(0)
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown()
  })
}
