import {
  isArticleId,
  isMeditationId,
  meditationText,
  zenArticles,
  type ContentLanguage,
  type PracticeKind,
} from '@mycogni/domain'

export interface PracticeTitles {
  breathing: string
  sound: (programme: string) => string
}

export function practiceTitle(
  kind: PracticeKind,
  contentId: string,
  language: ContentLanguage,
  titles: PracticeTitles,
): string {
  if (kind === 'meditation' && isMeditationId(contentId)) {
    return meditationText(contentId, language).title
  }
  if (kind === 'reading' && isArticleId(contentId)) {
    return zenArticles[contentId].text[language].title
  }
  if (kind === 'sound') {
    return titles.sound(contentId)
  }
  return titles.breathing
}
