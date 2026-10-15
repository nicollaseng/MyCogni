import type { ArticleId } from '../../catalog.ts'
import type { Article } from '../types.ts'
import { anxietyBasics } from './anxiety-basics.ts'
import { behaviouralActivation } from './behavioural-activation.ts'
import { breathingAndGrounding } from './breathing-and-grounding.ts'
import { performanceAnxiety } from './performance-anxiety.ts'
import { screeningNotDiagnosis } from './screening-not-diagnosis.ts'
import { sleepAndMood } from './sleep-and-mood.ts'
import { whenToSeekHelp } from './when-to-seek-help.ts'
import { worryTime } from './worry-time.ts'

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
