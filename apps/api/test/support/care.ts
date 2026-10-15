import { randomInt } from 'node:crypto'
import {
  invitationCodeAlphabet,
  invitationCodeLength,
  type ProfessionalStatus,
} from '@mycogni/domain'
import { eq, sql } from 'drizzle-orm'
import { authUsers } from 'drizzle-orm/supabase'
import type { Database, Transaction } from '../../src/db/client.ts'
import { invitations, professionalProfiles } from '../../src/db/schema/index.ts'

export function invitationCode(): string {
  return Array.from(
    { length: invitationCodeLength },
    () => invitationCodeAlphabet[randomInt(invitationCodeAlphabet.length)],
  ).join('')
}

export async function registerProfessional(
  db: Database,
  userId: string,
  {
    fullName = 'Dra. Helena Prado',
    status = 'verified',
  }: { fullName?: string; status?: ProfessionalStatus } = {},
): Promise<void> {
  await db.insert(professionalProfiles).values({
    userId,
    kind: 'psychologist',
    fullName,
    registration: 'CRP 06/123456',
    status,
    verifiedAt: status === 'verified' ? new Date() : null,
  })
}

export async function confirmEmail(db: Database, userId: string): Promise<string> {
  const [user] = await db
    .update(authUsers)
    .set({ emailConfirmedAt: new Date() })
    .where(eq(authUsers.id, userId))
    .returning({ email: authUsers.email })
  return user?.email ?? ''
}

interface InvitationSeed {
  professionalId: string
  code?: string
  recipientEmail?: string | null
  patientId?: string | null
  expired?: boolean
}

export async function seedInvitation(
  db: Database | Transaction,
  {
    professionalId,
    code = invitationCode(),
    recipientEmail = null,
    patientId = null,
    expired = false,
  }: InvitationSeed,
): Promise<{ id: string; code: string }> {
  const [row] = await db
    .insert(invitations)
    .values({
      code,
      professionalId,
      channel: recipientEmail === null ? 'link' : 'email',
      recipientEmail,
      patientId,
      createdAt: expired ? sql`now() - interval '73 hours'` : sql`now()`,
      expiresAt: expired ? sql`now() - interval '1 hour'` : sql`now() + interval '72 hours'`,
    })
    .returning({ id: invitations.id, code: invitations.code })
  if (row === undefined) {
    throw new Error('Invitation was not created')
  }
  return row
}

export async function makeAdmin(db: Database, userId: string): Promise<void> {
  await db.execute(
    sql`update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb where id = ${userId}`,
  )
}
