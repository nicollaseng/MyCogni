import { NextResponse } from 'next/server'
import { pageApiRefusal, pageRequestRefusal } from '@/features/mybook/page-responses'
import { createJournalEntry } from '@/shared/lib/api/journal'

export async function POST(request: Request) {
  const refusal = await pageRequestRefusal(request)
  if (refusal !== null) {
    return refusal
  }
  try {
    const { id } = await createJournalEntry()
    return NextResponse.json({ id }, { status: 201 })
  } catch (cause) {
    return pageApiRefusal(cause)
  }
}
