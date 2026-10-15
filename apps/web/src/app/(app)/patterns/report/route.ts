import type { NextRequest } from 'next/server'
import { reportResponse } from '@/features/reports/report-response'
import { fetchMoodReport } from '@/shared/lib/api/reports'

export function GET(request: NextRequest) {
  return reportResponse(request, fetchMoodReport)
}
