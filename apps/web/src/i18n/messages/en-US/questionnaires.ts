import { labelsFor } from '@mycogni/domain'
import type { QuestionnairesMessages } from '../pt-BR/questionnaires'

const labels = labelsFor('en-US')

export const questionnaires: QuestionnairesMessages = {
  meta: { title: 'Questionnaire' },
  label: 'Questionnaire',
  areas: {
    depression: 'About mood',
    anxiety: 'About anxiety',
    trauma: 'About memories of a difficult event',
    attention: 'About attention and restlessness',
    distress: 'About how you have been feeling',
  },
  names: {
    depression: 'Low mood',
    anxiety: 'Anxiety',
    trauma: 'Memories of a difficult event',
    attention: 'Inattention and restlessness',
    distress: 'Emotional distress',
  },
  levels: labels.plainLevels,
  size: '{count, plural, =0 {# questions} one {# question} other {# questions}} · about {minutes} min',
  card: {
    title: 'Your professional has shared a questionnaire',
    open: 'Answer',
    resume: 'Continue',
    more: '{count, plural, =0 {No more questionnaires} one {# more questionnaire} other {# more questionnaires}} to answer.',
    all: 'See all',
  },
  list: {
    title: 'Questionnaires',
    open: 'To answer',
    answered: 'Answered',
    empty: 'When your professional shares a questionnaire, it shows up here.',
    noneAnswered: 'You have not answered any questionnaire yet.',
    from: 'From {name}',
    progress: '{answered} of {total} answered',
    answeredOn: 'Answered on {date}',
    careful: 'Some answers need care',
    start: 'Answer',
    resume: 'Continue',
  },
  intro: {
    message: 'Message from {name}',
    notice:
      'Your professional will see your full answers. You will see a simple summary. This is not a diagnosis.',
    pause: 'You can stop at any time and continue later.',
    start: 'Start',
    later: 'Not now',
  },
  question: {
    back: 'Back',
    pause: 'Pause',
    progress: 'Question {current} of {total}',
    saving: 'Saving…',
    retry: 'Try again',
  },
  summary: {
    title: 'Thank you for answering.',
    talk: 'Talk to your professional about this.',
    notDiagnosis: 'This is a screening, not a diagnosis.',
    safety:
      'Some answers need care. Your professional will see what you answered, but does not watch the app all the time.',
    lines: 'If you think about hurting yourself, call:',
    today: 'Back to Today',
    list: 'See questionnaires',
    sentences: {
      depression: {
        low: 'Over the last 2 weeks, your answers show few signs of low mood. This does not rule out that something needs attention.',
        mild: 'Over the last 2 weeks, your answers show mild signs of low mood.',
        moderate: 'Over the last 2 weeks, your answers show moderate signs of low mood.',
        high: 'Over the last 2 weeks, your answers show strong signs of low mood.',
      },
      anxiety: {
        low: 'Over the last 2 weeks, your answers show few signs of anxiety. This does not rule out that something needs attention.',
        mild: 'Over the last 2 weeks, your answers show mild signs of anxiety.',
        moderate: 'Over the last 2 weeks, your answers show moderate signs of anxiety.',
        high: 'Over the last 2 weeks, your answers show strong signs of anxiety.',
      },
      trauma: {
        low: 'In the past month, your answers show that memories of a difficult event bothered you little. This does not rule out that something needs attention.',
        mild: 'In the past month, your answers show that memories of a difficult event bothered you mildly.',
        moderate:
          'In the past month, your answers show that memories of a difficult event bothered you moderately.',
        high: 'In the past month, your answers show that memories of a difficult event bothered you a lot.',
      },
      attention: {
        low: 'Over the past 6 months, your answers show few signs of inattention and restlessness. This does not rule out that something needs attention.',
        mild: 'Over the past 6 months, your answers show some signs of inattention and restlessness.',
        moderate:
          'Over the past 6 months, your answers show frequent signs of inattention and restlessness.',
        high: 'Over the past 6 months, your answers show very frequent signs of inattention and restlessness.',
      },
      distress: {
        low: 'Over the past 30 days, your answers show little emotional distress. This does not rule out that something needs attention.',
        mild: 'Over the past 30 days, your answers show mild emotional distress.',
        moderate: 'Over the past 30 days, your answers show moderate emotional distress.',
        high: 'Over the past 30 days, your answers show strong emotional distress.',
      },
    },
  },
  support: {
    continue: 'See the summary',
  },
  closed: {
    title: 'This questionnaire is no longer available.',
    body: 'Your professional can share another one when it makes sense.',
    back: 'Back',
  },
  errors: {
    save: 'We could not save right now. Try again in a moment.',
    closed: 'This questionnaire is no longer available.',
    language:
      'This questionnaire has no official version in the app language. Change the language in Profile or talk to your professional.',
  },
}
