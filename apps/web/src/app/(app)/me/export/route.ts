import { getTranslations } from 'next-intl/server'
import { NextResponse, type NextRequest } from 'next/server'
import { ApiError } from '@/shared/lib/api/client'
import { fetchAccountExport } from '@/shared/lib/api/resources'

export async function GET(request: NextRequest) {
  try {
    const [data, t] = await Promise.all([fetchAccountExport(), getTranslations('account.data')])
    const fileName = t('fileName', { day: data.exportedAt.slice(0, 10) })
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="${fileName}"`,
        'cache-control': 'no-store',
      },
    })
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
      return NextResponse.redirect(new URL('/auth/session-ended', request.url))
    }
    throw error
  }
}
