import {
  alertCountSchema,
  professionalAlertListSchema,
  type AlertCount,
  type ProfessionalAlert,
} from '@mycogni/contracts'
import { cache } from 'react'
import { z } from 'zod'
import { apiRequest } from './client'

export function fetchAlerts(patientId?: string): Promise<ProfessionalAlert[]> {
  const query = patientId === undefined ? '' : `?${new URLSearchParams({ patientId }).toString()}`
  return apiRequest({
    path: `/v1/professional/alerts${query}`,
    schema: professionalAlertListSchema,
  })
}

export const fetchAlertCount = cache((): Promise<AlertCount> =>
  apiRequest({ path: '/v1/professional/alerts/count', schema: alertCountSchema }),
)

export function preloadAlertCount(): void {
  fetchAlertCount().catch(() => undefined)
}

export async function changeAlert(id: string, action: 'acknowledge' | 'resolve'): Promise<void> {
  await apiRequest({
    path: `/v1/professional/alerts/${encodeURIComponent(id)}/${action}`,
    schema: z.null(),
    method: 'POST',
  })
}
