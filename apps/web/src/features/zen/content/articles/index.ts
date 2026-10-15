import type { ArticleId } from '@mycogni/domain'
import type { Article } from '../types'
import { anxietyBasics } from './anxiety-basics'
import { behaviouralActivation } from './behavioural-activation'
import { breathingAndGrounding } from './breathing-and-grounding'
import { performanceAnxiety } from './performance-anxiety'
import { screeningNotDiagnosis } from './screening-not-diagnosis'
import { sleepAndMood } from './sleep-and-mood'
import { whenToSeekHelp } from './when-to-seek-help'
import { worryTime } from './worry-time'

export const articles: Readonly<Record<ArticleId, Article>> = {
  'anxiety-basics': anxietyBasics,
  'worry-time': worryTime,
  'breathing-and-grounding': breathingAndGrounding,
  'performance-anxiety': performanceAnxiety,
  'behavioural-activation': behaviouralActivation,
  'sleep-and-mood': sleepAndMood,
  'screening-not-diagnosis': screeningNotDiagnosis,
  'when-to-seek-help': whenToSeekHelp,
}
