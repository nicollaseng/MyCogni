import { deleteTestUsers } from './supabase'

export default async function globalTeardown(): Promise<void> {
  await deleteTestUsers()
}
