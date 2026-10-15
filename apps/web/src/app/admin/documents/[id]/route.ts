import { NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchDocumentLink } from '@/shared/lib/api/care'

export async function GET(_request: Request, { params }: RouteContext<'/admin/documents/[id]'>) {
  const { id } = await params
  const link = z.uuid().safeParse(id).success ? await fetchDocumentLink(id) : null
  if (link === null) {
    return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  }
  return NextResponse.redirect(link.url, { status: 303, headers: { 'cache-control': 'no-store' } })
}
