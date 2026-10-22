import {
  dataExportDownloadSchema,
  dataExportSchema,
  latestDataExportSchema,
  type DataExport,
} from '@mycogni/contracts'
import { apiRequest } from './client'

export async function fetchLatestExport(): Promise<DataExport | null> {
  return (await apiRequest({ path: '/v1/me/exports/latest', schema: latestDataExportSchema }))
    .export
}

export function requestExport(): Promise<DataExport> {
  return apiRequest({ path: '/v1/me/exports', schema: dataExportSchema, method: 'POST' })
}

export async function exportDownloadUrl(id: string): Promise<string> {
  return (
    await apiRequest({
      path: `/v1/me/exports/${id}/download`,
      schema: dataExportDownloadSchema,
    })
  ).url
}
