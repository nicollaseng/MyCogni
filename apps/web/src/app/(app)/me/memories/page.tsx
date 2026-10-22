import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import {
  addMemory,
  clearMemories,
  editMemory,
  removeMemory,
  setMemoriesEnabled,
} from '@/features/memories/actions'
import { MemoriesSwitch } from '@/features/memories/components/memories-switch'
import { MemoryBoard } from '@/features/memories/components/memory-board'
import { shownMemories } from '@/features/memories/shown-memories'
import { fetchMemories } from '@/shared/lib/api/memories'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('memories.meta')
  return { title: t('title') }
}

export default async function MemoriesPage() {
  const [profile, [memories, t]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([fetchMemories(), getTranslations('memories')]),
  )

  return (
    <MemoryBoard
      title={t('meta.title')}
      intro={
        <div className="space-y-3">
          <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
            {t('lead')}
          </p>
          <MemoriesSwitch
            enabled={profile.memoriesEnabled}
            setMemoriesEnabled={setMemoriesEnabled}
          />
        </div>
      }
      initial={await shownMemories(memories, profile.timezone)}
      actions={{ add: addMemory, edit: editMemory, remove: removeMemory, clear: clearMemories }}
    />
  )
}
