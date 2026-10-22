import { invitationStatuses, notificationKinds, supportTicketStatuses } from '@mycogni/domain'
import { z } from 'zod'
import { professionalSummarySchema } from './invitations.ts'

const timestamp = z.iso.datetime({ offset: true })

export const notificationSchema = z.object({
  id: z.uuid(),
  kind: z.enum(notificationKinds),
  createdAt: timestamp,
  readAt: timestamp.nullable(),
  insightId: z.uuid().nullable(),
  supportTicket: z
    .object({
      id: z.uuid(),
      number: z.int().positive(),
      status: z.enum(supportTicketStatuses),
    })
    .nullable(),
  invitation: z
    .object({
      id: z.uuid(),
      status: z.enum(invitationStatuses),
      professional: professionalSummarySchema.pick({ name: true, kind: true }),
    })
    .nullable(),
  questionnaire: z
    .object({
      assignmentId: z.uuid(),
      patientId: z.uuid(),
      patientName: z.string().nullable(),
    })
    .nullable(),
})

export type Notification = z.infer<typeof notificationSchema>

export const notificationListSchema = z.object({
  items: z.array(notificationSchema),
  unread: z.int().min(0),
})

export type NotificationList = z.infer<typeof notificationListSchema>

export const markNotificationsReadSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(100).optional(),
})

export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>
