import { dataExportStatuses } from '@mycogni/domain'
import { z } from 'zod'

export const dataExportSchema = z.object({
  id: z.uuid(),
  status: z.enum(dataExportStatuses),
  requestedAt: z.iso.datetime({ offset: true }),
  readyAt: z.iso.datetime({ offset: true }).nullable(),
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
  sizeBytes: z.int().min(0).nullable(),
})

export type DataExport = z.infer<typeof dataExportSchema>

export const latestDataExportSchema = z.object({ export: dataExportSchema.nullable() })

export type LatestDataExport = z.infer<typeof latestDataExportSchema>

export const dataExportDownloadSchema = z.object({ url: z.url() })

export type DataExportDownload = z.infer<typeof dataExportDownloadSchema>
