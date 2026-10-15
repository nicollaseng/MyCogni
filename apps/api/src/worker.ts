import { Queue, Worker } from 'bullmq'
import { z } from 'zod'
import { createClaudeInsightWriter } from './ai/insight-writer.ts'
import { loadConfig } from './config/env.ts'
import { connectDatabase } from './db/client.ts'
import { alertTriggerSchema } from './jobs/alert-trigger.ts'
import { expireInvitations } from './jobs/expire-invitations.ts'
import {
  alertQueueName,
  createRedis,
  insightQueueName,
  maintenanceQueueName,
} from './jobs/redis.ts'
import { createJobScheduler } from './jobs/scheduler.ts'
import { createMailer } from './mail/mailer.ts'
import { createAlertJob } from './modules/alerts/alert-job.ts'
import { createAlertStore } from './modules/alerts/alert-store.ts'
import { createAssessmentRepository } from './modules/assessments/assessment.repository.ts'
import { createPatientMetricsRepository } from './modules/care-links/patient-metrics.repository.ts'
import { createCheckInRepository } from './modules/check-ins/check-in.repository.ts'
import { createInsightJob } from './modules/insights/insight-job.ts'
import { createInsightRepository } from './modules/insights/insight.repository.ts'
import type { ErrorLog } from './shared/log.ts'

const config = loadConfig(process.env)
if (config.redisUrl === null) {
  console.error('REDIS_URL is required to run the worker')
  process.exit(1)
}
const redisUrl = config.redisUrl
const prefix = config.queuePrefix
const log: ErrorLog = {
  error: (details, message) => {
    console.error(JSON.stringify({ level: 'error', msg: message }), details)
  },
}
const database = connectDatabase(config.databaseUrl)
const scheduler = createJobScheduler({ redisUrl, prefix }, log)
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
        alerts: scheduler,
        now: () => new Date(),
      })
const alertJob = createAlertJob({
  store: createAlertStore(database.db),
  metrics: createPatientMetricsRepository(database.db),
  mailer: createMailer(config.mail, log),
  webUrl: config.webUrl,
  now: () => new Date(),
})

const insightPayload = z.object({ patientId: z.uuid() })

const connections = [
  createRedis(redisUrl),
  createRedis(redisUrl),
  createRedis(redisUrl),
  createRedis(redisUrl),
  createRedis(redisUrl),
] as const

const insightWorker = new Worker(
  insightQueueName,
  async (job) => {
    if (insightJob === null) {
      return { kind: 'skipped', reason: 'ai_disabled' }
    }
    return insightJob.run(insightPayload.parse(job.data).patientId)
  },
  { connection: connections[0], concurrency: 2, prefix },
)

const maintenanceQueue = new Queue(maintenanceQueueName, { connection: connections[1], prefix })
await maintenanceQueue.upsertJobScheduler(
  'expire-invitations',
  { every: 60 * 60 * 1000 },
  { name: 'expire-invitations' },
)
const maintenanceWorker = new Worker(
  maintenanceQueueName,
  async () => ({ expired: await expireInvitations(database.db) }),
  { connection: connections[2], prefix },
)

const alertQueue = new Queue(alertQueueName, { connection: connections[3], prefix })
await alertQueue.upsertJobScheduler(
  'daily-review',
  { pattern: '0 11 * * *' },
  { name: 'daily', data: { kind: 'daily' } },
)
const alertWorker = new Worker(
  alertQueueName,
  (job) => alertJob.run(alertTriggerSchema.parse(job.data)),
  { connection: connections[4], concurrency: 2, prefix },
)

const workers = [insightWorker, maintenanceWorker, alertWorker]

for (const worker of workers) {
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
    prefix,
  }),
)

async function shutdown(): Promise<void> {
  await Promise.all([
    ...workers.map((worker) => worker.close()),
    maintenanceQueue.close(),
    alertQueue.close(),
    scheduler.close(),
  ])
  await Promise.all(connections.map((connection) => connection.quit()))
  await database.close()
  process.exit(0)
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown()
  })
}
