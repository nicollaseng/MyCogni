import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { BookViews } from '@/features/mybook/components/book-views'
import { changePhoto, loadPhotos } from '@/features/mybook/photos/actions'
import { photoBatch } from '@/features/mybook/photos/model'
import { PhotoGrid } from '@/features/mybook/photos/photo-grid'
import { fetchJournalPhotos } from '@/shared/lib/api/journal'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mybook.photoGrid')
  return { title: t('meta') }
}

export default async function MybookPhotosPage() {
  const [{ timezone }, [first, t]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([
      fetchJournalPhotos({ offset: 0, limit: photoBatch }),
      getTranslations('mybook.list'),
    ]),
  )

  return (
    <>
      <header className="space-y-5">
        <h1 className="font-serif text-[40px] leading-[1.04] tracking-[-0.02em] sm:text-5xl">
          {t('title')}
        </h1>
        <BookViews current="photos" />
      </header>
      <PhotoGrid initial={first} timeZone={timezone} load={loadPhotos} change={changePhoto} />
    </>
  )
}
