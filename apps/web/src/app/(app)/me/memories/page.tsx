import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SettingsPage } from '@/features/account/components/settings-page'
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
import { Panel } from '@/shared/components/section'
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
    <SettingsPage title={t('meta.title')}>
      <div className="space-y-4">
        <p className="max-w-xl text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {t('lead')}
        </p>
        <Panel>
          <MemoriesSwitch
            enabled={profile.memoriesEnabled}
            setMemoriesEnabled={setMemoriesEnabled}
          />
        </Panel>
      </div>
      <MemoryBoard
        initial={await shownMemories(memories, profile.timezone)}
        actions={{ add: addMemory, edit: editMemory, remove: removeMemory, clear: clearMemories }}
      />
    </SettingsPage>
  )
}
