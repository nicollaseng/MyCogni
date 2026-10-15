import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { reportResponse } from '@/features/reports/report-response'
import { fetchPatientMoodReport } from '@/shared/lib/api/reports'

export async function GET(
  request: NextRequest,
  { params }: RouteContext<'/pro/patients/[id]/report'>,
) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  }
  return reportResponse(request, (query) => fetchPatientMoodReport(id, query))
}
