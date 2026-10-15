import {
  contextGroups,
  suggestedContexts,
  type ContextGroupId,
  type ContextId,
  type EmotionFamilyId,
  type EmotionId,
} from '@mycogni/domain'

export interface Choice {
  id: string
  label: string
}

export interface ChoiceGroup {
  id: string
  title: string
  items: readonly Choice[]
}

export interface CatalogTab<GroupId extends string, ItemId extends string> {
  id: GroupId | 'suggestions'
  items: readonly ItemId[]
}

export type EmotionTab = CatalogTab<EmotionFamilyId, EmotionId>

export type ContextTab = CatalogTab<ContextGroupId, ContextId>

export interface EmotionFamily {
  id: EmotionFamilyId
  valence: number
  items: readonly EmotionId[]
}

export const contextTabs: readonly ContextTab[] = [
  { id: 'suggestions', items: suggestedContexts },
  ...contextGroups,
]
