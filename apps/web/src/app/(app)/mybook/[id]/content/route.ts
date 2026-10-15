import { updateJournalEntrySchema } from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { pageApiRefusal, pageRequestRefusal } from '@/features/mybook/page-responses'
import { safetyPromptFor } from '@/features/safety/prompt'
import { deleteJournalEntry, updateJournalEntry } from '@/shared/lib/api/journal'
import { refuse } from '@/shared/lib/upload-responses'

type Context = RouteContext<'/mybook/[id]/content'>

async function entryIdOf({ params }: Context): Promise<string | null> {
  const { id } = await params
  return z.uuid().safeParse(id).success ? id : null
}

export async function PUT(request: Request, context: Context) {
  const refusal = await pageRequestRefusal(request)
  if (refusal !== null) {
    return refusal
  }
  const id = await entryIdOf(context)
  if (id === null) {
    return refuse(404, 'NOT_FOUND')
  }
  const parsed = updateJournalEntrySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return refuse(422, 'INVALID_CONTENT')
  }
  try {
    const entry = await updateJournalEntry(id, parsed.data)
    const safety = await safetyPromptFor(entry.support.level)
    return NextResponse.json({ updatedAt: entry.updatedAt, safety })
  } catch (cause) {
    return pageApiRefusal(cause)
  }
}

export async function DELETE(request: Request, context: Context) {
  const refusal = await pageRequestRefusal(request)
  if (refusal !== null) {
    return refusal
  }
  const id = await entryIdOf(context)
  if (id === null) {
    return refuse(404, 'NOT_FOUND')
  }
  try {
    await deleteJournalEntry(id)
  } catch (cause) {
    return pageApiRefusal(cause)
  }
  revalidatePath('/mybook', 'layout')
  return new NextResponse(null, { status: 204 })
}
