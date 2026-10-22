import { sharingConsentVersion } from '@mycogni/domain'
import type { Database } from '../../src/db/client.ts'
import { careLinks } from '../../src/db/schema/index.ts'

export async function seedLink(
  db: Database,
  professionalId: string,
  patientId: string,
): Promise<string> {
  const [link] = await db
    .insert(careLinks)
    .values({ professionalId, patientId, consentVersion: sharingConsentVersion })
    .returning({ id: careLinks.id })
  if (link === undefined) {
    throw new Error('The care link was not seeded')
  }
  return link.id
}

export const phq9WithRisk = [1, 1, 0, 0, 0, 0, 0, 0, 1]

export const phq9Calm = [0, 0, 0, 1, 0, 0, 0, 0, 0]
