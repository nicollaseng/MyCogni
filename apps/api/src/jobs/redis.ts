import { Redis } from 'ioredis'

export function createRedis(redisUrl: string): Redis {
  return new Redis(redisUrl, { maxRetriesPerRequest: null, family: 0 })
}

export const insightQueueName = 'insights'

export const maintenanceQueueName = 'maintenance'

export const alertQueueName = 'alerts'

export const memoryQueueName = 'memories'

export const reminderQueueName = 'reminders'
