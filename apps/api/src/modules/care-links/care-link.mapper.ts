import type { CareLink } from '@mycogni/contracts'
import { isSharingConsentCurrent } from '@mycogni/domain'
import type { BucketStore } from '../../storage/bucket-store.ts'
import type { CareLinkRecord } from './care-link.repository.ts'

export async function toCareLinks(
  records: readonly CareLinkRecord[],
  photos: BucketStore,
): Promise<CareLink[]> {
  const urls = await photos.sign(
    records.flatMap(({ professional }) =>
      professional.avatarPath === null ? [] : [professional.avatarPath],
    ),
  )
  return records.map(({ professional: { avatarPath, ...professional }, ...record }) => ({
    ...record,
    professional: {
      ...professional,
      photoUrl: avatarPath === null ? null : (urls[avatarPath] ?? null),
    },
    startedAt: record.startedAt.toISOString(),
    termsOutdated: !isSharingConsentCurrent(record.consentVersion),
  }))
}
