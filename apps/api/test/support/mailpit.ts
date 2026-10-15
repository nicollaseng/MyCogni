import { z } from 'zod'
import { testMailpitUrl } from './supabase.ts'

const searchSchema = z.object({
  messages: z.array(z.object({ ID: z.string(), Subject: z.string() })),
})

const messageSchema = z.object({ Subject: z.string(), HTML: z.string(), Text: z.string() })

export type MailpitMessage = z.infer<typeof messageSchema>

export async function lastMailTo(address: string): Promise<MailpitMessage | null> {
  const query = encodeURIComponent(`to:"${address}"`)
  const search = searchSchema.parse(
    await (await fetch(`${testMailpitUrl}/api/v1/search?query=${query}&limit=1`)).json(),
  )
  const [first] = search.messages
  if (first === undefined) {
    return null
  }
  return messageSchema.parse(
    await (await fetch(`${testMailpitUrl}/api/v1/message/${first.ID}`)).json(),
  )
}
