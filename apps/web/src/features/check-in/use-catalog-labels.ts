import { isContextId, isEmotionId } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import type { ChoiceGroup, ContextTab, EmotionTab } from './catalog'

export interface CatalogLabels {
  emotion: (tag: string) => string
  context: (tag: string) => string
  emotionChoices: (tabs: readonly EmotionTab[]) => ChoiceGroup[]
  contextChoices: (tabs: readonly ContextTab[]) => ChoiceGroup[]
}

export function useCatalogLabels(): CatalogLabels {
  const t = useTranslations('checkIn')

  return {
    emotion: (tag) => (isEmotionId(tag) ? t(`emotions.${tag}`) : tag),
    context: (tag) => (isContextId(tag) ? t(`contexts.${tag}`) : tag),
    emotionChoices: (tabs) =>
      tabs.map((tab) => ({
        id: tab.id,
        title: tab.id === 'suggestions' ? t('picker.suggestions') : t(`emotionFamilies.${tab.id}`),
        items: tab.items.map((id) => ({ id, label: t(`emotions.${id}`) })),
      })),
    contextChoices: (tabs) =>
      tabs.map((tab) => ({
        id: tab.id,
        title: tab.id === 'suggestions' ? t('picker.suggestions') : t(`contextGroups.${tab.id}`),
        items: tab.items.map((id) => ({ id, label: t(`contexts.${id}`) })),
      })),
  }
}
