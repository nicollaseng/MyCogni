import { z } from 'zod'

const env = z
  .object({
    SUPABASE_URL: z.url().transform((value) => value.replace(/\/+$/, '')),
    SUPABASE_SECRET_KEY: z.string().min(1),
  })
  .parse(process.env)

const email = z.email().parse(process.argv[2]?.trim().toLowerCase())

const headers = {
  apikey: env.SUPABASE_SECRET_KEY,
  authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
  'content-type': 'application/json',
}

const pageSchema = z.object({
  users: z.array(
    z.object({
      id: z.uuid(),
      email: z.string().nullish(),
      app_metadata: z.record(z.string(), z.unknown()).nullish(),
    }),
  ),
})

async function findUser(page = 1): Promise<z.infer<typeof pageSchema>['users'][number] | null> {
  const response = await fetch(
    `${env.SUPABASE_URL}/auth/v1/admin/users?page=${String(page)}&per_page=500`,
    {
      headers,
    },
  )
  const { users } = pageSchema.parse(await response.json())
  const found = users.find((user) => user.email?.toLowerCase() === email)
  if (found !== undefined || users.length === 0) {
    return found ?? null
  }
  return findUser(page + 1)
}

const user = await findUser()
if (user === null) {
  console.error(`No account with ${email}`)
  process.exit(1)
}
const response = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({ app_metadata: { ...user.app_metadata, role: 'admin' } }),
})
if (!response.ok) {
  console.error(`Supabase answered ${String(response.status)}: ${await response.text()}`)
  process.exit(1)
}
console.info(`${email} can now review professionals`)
