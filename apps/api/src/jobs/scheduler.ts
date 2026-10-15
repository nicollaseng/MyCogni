import { Queue, type JobsOptions } from 'bullmq'
import type { ErrorLog } from '../shared/log.ts'
import type { AlertTrigger, SavedNote } from './alert-trigger.ts'
import { alertQueueName, createRedis, insightQueueName } from './redis.ts'

export interface JobScheduler {
  checkInRecorded(patientId: string): Promise<void>
  assessmentCompleted(patientId: string, assessmentId: string): Promise<void>
  summaryCreated(insightId: string): Promise<void>
  noteSaved(note: SavedNote): Promise<void>
  close(): Promise<void>
}

export interface QueueSettings {
  redisUrl: string | null
  prefix: string
}

const insightBatchingMs = 60_000

const alertBatchingMs = 30_000

function noteJobId(note: SavedNote): string {
  switch (note.kind) {
    case 'check_in':
      return `alert-note-${note.checkInId}`
    case 'addendum':
      return `alert-note-${note.addendumId}`
    case 'journal':
      return `alert-note-${note.entryId}`
  }
}

const cleanup: JobsOptions = { removeOnComplete: true, removeOnFail: 100, attempts: 3 }

const idleScheduler: JobScheduler = {
  checkInRecorded: () => Promise.resolve(),
  assessmentCompleted: () => Promise.resolve(),
  summaryCreated: () => Promise.resolve(),
  noteSaved: () => Promise.resolve(),
  close: () => Promise.resolve(),
}

export function createJobScheduler(
  { redisUrl, prefix }: QueueSettings,
  log: ErrorLog,
): JobScheduler {
  if (redisUrl === null) {
    return idleScheduler
  }
  const redis = createRedis(redisUrl)
  const insights = new Queue(insightQueueName, { connection: redis, prefix })
  const alerts = new Queue(alertQueueName, { connection: redis, prefix })

  async function enqueue(what: string, work: () => Promise<unknown>): Promise<void> {
    try {
      await work()
    } catch (error) {
      log.error({ err: error }, `${what} job was not scheduled`)
    }
  }

  function alert(trigger: AlertTrigger, jobId: string, delay = 0): Promise<void> {
    return enqueue('Alert', () =>
      alerts.add(trigger.kind, trigger, {
        ...cleanup,
        jobId,
        delay,
        backoff: { type: 'exponential', delay: 5_000 },
      }),
    )
  }

  return {
    async checkInRecorded(patientId) {
      await enqueue('Insight', () =>
        insights.add(
          'check-in-recorded',
          { patientId },
          {
            ...cleanup,
            jobId: `insight-${patientId}`,
            delay: insightBatchingMs,
            backoff: { type: 'exponential', delay: 30_000 },
          },
        ),
      )
      await alert({ kind: 'check-in', patientId }, `alert-check-in-${patientId}`, alertBatchingMs)
    },
    assessmentCompleted(patientId, assessmentId) {
      return alert(
        { kind: 'assessment', patientId, assessmentId },
        `alert-assessment-${assessmentId}`,
      )
    },
    summaryCreated(insightId) {
      return alert({ kind: 'summary', insightId }, `alert-summary-${insightId}`)
    },
    noteSaved(note) {
      return alert({ kind: 'note', note }, noteJobId(note))
    },
    async close() {
      await Promise.all([insights.close(), alerts.close()])
      await redis.quit()
    },
  }
}
