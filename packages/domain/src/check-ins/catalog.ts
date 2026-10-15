export const emotionFamilies = [
  {
    id: 'anxiety',
    valence: 0.15,
    items: [
      'anxiety',
      'worry',
      'fear',
      'nervousness',
      'insecurity',
      'restlessness',
      'apprehension',
      'panic',
    ],
  },
  {
    id: 'sadness',
    valence: 0.1,
    items: [
      'sadness',
      'discouragement',
      'loneliness',
      'longing',
      'emptiness',
      'disappointment',
      'hopelessness',
      'guilt',
      'shame',
    ],
  },
  {
    id: 'anger',
    valence: 0.2,
    items: ['anger', 'irritation', 'frustration', 'impatience', 'resentment', 'jealousy'],
  },
  {
    id: 'exhaustion',
    valence: 0.3,
    items: ['tiredness', 'overload', 'stress', 'exhaustion', 'apathy'],
  },
  {
    id: 'mixed',
    valence: 0.5,
    items: ['confusion', 'indifference', 'boredom', 'nostalgia', 'surprise', 'ambivalence'],
  },
  {
    id: 'calm',
    valence: 0.75,
    items: ['calm', 'tranquility', 'relief', 'peace', 'contentment', 'satisfaction', 'safety'],
  },
  {
    id: 'energy',
    valence: 0.8,
    items: ['motivation', 'focus', 'vigor', 'inspiration', 'curiosity', 'courage'],
  },
  {
    id: 'connection',
    valence: 0.85,
    items: ['gratitude', 'love', 'affection', 'belonging', 'cared_for', 'compassion'],
  },
  {
    id: 'joy',
    valence: 0.9,
    items: ['joy', 'happiness', 'enthusiasm', 'excitement', 'fun', 'hope', 'pride', 'confidence'],
  },
] as const

export const contextGroups = [
  {
    id: 'body',
    items: [
      'sleep',
      'eating',
      'exercise',
      'health',
      'pain',
      'menstrual_cycle',
      'medication',
      'alcohol',
    ],
  },
  { id: 'people', items: ['family', 'partner', 'friends', 'children', 'coworkers', 'pets'] },
  { id: 'routine', items: ['work', 'studies', 'money', 'home', 'commute', 'free_time'] },
  { id: 'world', items: ['news', 'social_media', 'weather', 'city'] },
  { id: 'inner', items: ['self_esteem', 'purpose', 'faith', 'therapy'] },
] as const

export const suggestedContexts = [
  'sleep',
  'work',
  'family',
  'health',
  'money',
  'partner',
  'friends',
  'exercise',
] as const

export type EmotionFamilyId = (typeof emotionFamilies)[number]['id']
export type EmotionId = (typeof emotionFamilies)[number]['items'][number]
export type ContextGroupId = (typeof contextGroups)[number]['id']
export type ContextId = (typeof contextGroups)[number]['items'][number]

export const emotionIds: readonly EmotionId[] = emotionFamilies.flatMap((family) => family.items)
export const contextIds: readonly ContextId[] = contextGroups.flatMap((group) => group.items)

export function isEmotionId(tag: string): tag is EmotionId {
  return emotionIds.some((id) => id === tag)
}

export function isContextId(tag: string): tag is ContextId {
  return contextIds.some((id) => id === tag)
}
