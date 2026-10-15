import { labelsFor } from '@mycogni/domain'
import type { CheckInMessages } from '../pt-BR/check-in'

const labels = labelsFor('en-US')

export const checkIn: CheckInMessages = {
  meta: {
    title: 'Check-in',
  },
  flow: {
    back: 'Back',
    close: 'Close',
    progress: 'Step {current} of {total}',
    continue: 'Continue',
    continueWith: 'Continue with {count}',
    skip: 'Skip',
    save: 'Save',
    saving: 'Saving…',
  },
  mood: {
    question: 'How are you feeling right now?',
    onlyMood: 'Log just my mood',
  },
  emotionStep: {
    title: 'What are you feeling?',
    search: 'Search or type another',
  },
  contextStep: {
    title: 'What is it connected to?',
    search: 'Search or type another',
    noteLabel: 'Note about today',
    notePlaceholder: 'Anything you want to note about today?',
  },
  picker: {
    suggestions: 'suggestions',
    chosen: 'Selected: <list>{items}</list>',
    add: 'Add {item}',
  },
  done: {
    title: 'Logged at {time}.',
    days: 'See my days',
    entries: 'See entries',
  },
  errors: {
    save: 'We could not save this right now. Please try again in a moment.',
  },
  emotionFamilies: {
    anxiety: 'anxiety',
    sadness: 'sadness',
    anger: 'anger',
    exhaustion: 'tiredness',
    mixed: 'mixed',
    calm: 'calm',
    energy: 'energy',
    connection: 'connection',
    joy: 'joy',
  },
  emotions: labels.emotions,
  contextGroups: {
    body: 'body',
    people: 'people',
    routine: 'routine',
    world: 'world',
    inner: 'inner life',
  },
  contexts: labels.contexts,
}
