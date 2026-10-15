import { EntryDetailSkeleton } from '@/features/entries/components/entry-detail-skeleton'

export default function PatientEntryLoading() {
  return (
    <div className="max-w-3xl">
      <EntryDetailSkeleton />
    </div>
  )
}
