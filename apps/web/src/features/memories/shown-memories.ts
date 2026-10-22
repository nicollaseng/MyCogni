import type { Memory } from '@mycogni/contracts'
import { getFormatter, getTranslations } from 'next-intl/server'
import type { ShownMemory } from './shown-memory'
import { sourceHintOf } from './source-hint'

export async function shownMemories(
  memories: readonly Memory[],
  timeZone: string,
): Promise<ShownMemory[]> {
  const [t, format] = await Promise.all([getTranslations('memories.source'), getFormatter()])
  return memories.map((memory) => {
    const hint = sourceHintOf(memory)
    return {
      id: memory.id,
      content: memory.content,
      kind: memory.kind,
      status: memory.status,
      hint:
        hint === null
          ? null
          : hint.key === 'checkIn'
            ? t('checkIn', {
                date: format.dateTime(new Date(hint.at), {
                  day: 'numeric',
                  month: 'short',
                  timeZone,
                }),
              })
            : t(hint.key),
    }
  })
}
