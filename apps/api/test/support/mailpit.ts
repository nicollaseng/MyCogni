import { z } from 'zod'
import { testMailpitUrl } from './supabase.ts'

const searchSchema = z.object({
  messages: z.array(z.object({ ID: z.string(), Subject: z.string() })),
})

const messageSchema = z.object({
  Subject: z.string(),
  HTML: z.string(),
  Text: z.string(),
  ReplyTo: z.array(z.object({ Address: z.string() })).default([]),
})

export type MailpitMessage = z.infer<typeof messageSchema>

const attempts = 20

async function firstMatch(query: string): Promise<MailpitMessage | null> {
  const search = searchSchema.parse(
    await (
      await fetch(`${testMailpitUrl}/api/v1/search?query=${encodeURIComponent(query)}&limit=1`)
    ).json(),
  )
  const [first] = search.messages
  if (first === undefined) {
    return null
  }
  return messageSchema.parse(
    await (await fetch(`${testMailpitUrl}/api/v1/message/${first.ID}`)).json(),
  )
}

export function lastMailTo(address: string): Promise<MailpitMessage | null> {
  return firstMatch(`to:"${address}"`)
}

export async function mailMatching(address: string, subject: string): Promise<MailpitMessage> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const message = await firstMatch(`to:"${address}" subject:"${subject}"`)
    if (message !== null) {
      return message
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  throw new Error(`No email to ${address} with subject ${subject}`)
}
