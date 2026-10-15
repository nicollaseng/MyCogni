import { moodReportQuerySchema } from '@mycogni/contracts'
import { getLocale } from 'next-intl/server'
import { NextResponse, type NextRequest } from 'next/server'
import { ApiError, type ApiFile } from '@/shared/lib/api/client'
import { reportQuery } from './download'

export async function reportResponse(
  request: NextRequest,
  load: (query: string) => Promise<ApiFile>,
): Promise<NextResponse> {
  const parsed = moodReportQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return NextResponse.json({ code: 'VALIDATION_ERROR' }, { status: 400 })
  }
  const query = new URLSearchParams(reportQuery(parsed.data))
  query.set('locale', await getLocale())
  try {
    const file = await load(query.toString())
    return new NextResponse(file.bytes, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': file.disposition,
        'cache-control': 'no-store',
      },
    })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ code: error.code }, { status: error.status })
    }
    throw error
  }
}
