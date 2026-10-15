import { randomUUID } from 'node:crypto'
import { Queue } from 'bullmq'
import { alertTriggerSchema, type AlertTrigger } from '../../src/jobs/alert-trigger.ts'
import { alertQueueName, createRedis, insightQueueName } from '../../src/jobs/redis.ts'

export type NoteTrigger = Extract<AlertTrigger, { kind: 'note' }>

export interface QueuedNote {
  trigger: NoteTrigger
  payload: string
}

export interface NoteQueue {
  redisUrl: string
  prefix: string
  take(): Promise<QueuedNote[]>
  close(): Promise<void>
}

export function createNoteQueue(): NoteQueue {
  const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:56379'
  const prefix = `e2e-notes-${randomUUID().slice(0, 8)}`
  const connection = createRedis(redisUrl)
  const alerts = new Queue(alertQueueName, { connection, prefix })
  const insights = new Queue(insightQueueName, { connection, prefix })

  return {
    redisUrl,
    prefix,
    async take() {
      const jobs = await alerts.getJobs(['waiting', 'delayed', 'prioritized'])
      const notes: QueuedNote[] = []
      for (const job of jobs.sort((first, second) => first.timestamp - second.timestamp)) {
        const trigger = alertTriggerSchema.parse(job.data)
        if (trigger.kind === 'note') {
          notes.push({ trigger, payload: JSON.stringify(job.data) })
          await job.remove()
        }
      }
      return notes
    },
    async close() {
      for (const queue of [alerts, insights]) {
        await queue.obliterate({ force: true })
        await queue.close()
      }
      await connection.quit()
    },
  }
}
