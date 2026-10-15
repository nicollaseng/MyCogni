import type { ZenMessages } from '../pt-BR/zen'

export const zen: ZenMessages = {
  meta: {
    title: 'Zen Space',
  },
  title: 'Zen Space',
  description:
    'Short reads, tracks and exercises to look after your mind at your own pace, based on what science knows today.',
  disclaimer: 'Educational content, not a substitute for professional care.',
  forYou: {
    title: 'For you now',
    kicker: 'Suggested track',
    progress: '{done} of {total} steps',
    start: 'Start the track',
    continue: 'Continue the track',
    review: 'Revisit the track',
    also: 'Might also help',
    readings: 'Suggested reads',
    why: 'Why these suggestions?',
    rules:
      'Suggestions follow simple rules about your latest questionnaires and your check-ins from the last 7 days. They are not a diagnosis.',
    reasons: {
      risk_item:
        'On your latest PHQ-9, you said you had thoughts of being better off dead or of hurting yourself.',
      severe_result:
        'One of your latest questionnaires was in the severe or moderately severe range.',
      anxiety: 'Your latest GAD-7 was in the moderate range or above.',
      depression: 'Your latest PHQ-9 was in the moderate range or above.',
      low_mood: 'Your average mood over your check-ins from the last 7 days was low.',
      starting:
        'Nothing in your recent results needs attention right now. Sleep is a good place to start looking after your mood.',
    },
  },
  help: {
    title: 'Take care of this with someone',
    body: 'Your recent results call for attention. Talk to a health professional about how you have been feeling. If you are in danger right now, call:',
    professional: '{name} follows your check-ins. It is worth telling {name} what has changed.',
  },
  tracks: {
    title: 'Tracks',
    status: {
      new: 'Not started',
      started: '{done} of {total} steps',
      complete: 'Completed',
    },
  },
  readings: {
    title: 'Reads',
    minutes: '{minutes} min read',
  },
  article: {
    back: 'Zen Space',
    kicker: 'Read · {minutes} min',
    references: 'References',
    inTracks: 'This read is part of',
    helpTitle: 'Where to get help',
  },
  track: {
    back: 'Zen Space',
    kicker: 'Track · {count, plural, one {# step} other {# steps}}',
    progress: '{done} of {total} steps done',
    step: 'Step {number}',
    done: 'Done',
    markDone: 'Mark as done',
    saving: 'Saving…',
    saveError: 'We could not save this right now. Try again in a moment.',
    writeError: 'We could not open a MyBook page right now. Try again in a moment.',
    opening: 'Opening MyBook…',
    complete: 'You have completed this track. Come back to it whenever you like.',
    actions: {
      read: 'Read',
      breathe: 'Start the exercise',
      write: 'Write in MyBook',
      check_in: 'Check in',
      questionnaire: 'Answer the questionnaires',
    },
    reflectHint: 'Take your time with it. If you like, write your answer in MyBook.',
  },
  breathing: {
    title: 'Box breathing',
    intro:
      'Breathe in, hold, breathe out and wait, counting to four for each part. Four rounds take about a minute. If you feel dizzy, go back to breathing normally.',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    restart: 'Start again',
    close: 'Close',
    phases: {
      inhale: 'Breathe in',
      holdIn: 'Hold',
      exhale: 'Breathe out',
      holdOut: 'Wait',
    },
    ready: 'Ready when you are',
    round: 'Round {current} of {total}',
    finished: 'Done. How are you feeling now?',
  },
}
