import { apiFile, type ApiFile } from './client'

export function fetchMoodReport(query: string): Promise<ApiFile> {
  return apiFile(`/v1/reports/mood?${query}`)
}

export function fetchPatientMoodReport(patientId: string, query: string): Promise<ApiFile> {
  return apiFile(`/v1/professional/patients/${patientId}/reports/mood?${query}`)
}
