import { NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchSupportAttachmentLink } from '@/shared/lib/api/support'

export async function GET(
  _request: Request,
  { params }: RouteContext<'/admin/support/[id]/attachment'>,
) {
  const { id } = await params
  const link = z.uuid().safeParse(id).success ? await fetchSupportAttachmentLink(id) : null
  if (link === null) {
    return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  }
  return NextResponse.redirect(link.url, { status: 303, headers: { 'cache-control': 'no-store' } })
}
