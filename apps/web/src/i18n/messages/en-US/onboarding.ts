import type { OnboardingMessages } from '../pt-BR/onboarding'

export const onboarding: OnboardingMessages = {
  meta: {
    title: 'Getting started',
  },
  header: {
    signOut: 'Sign out',
    progress: 'Step {current} of {total}',
  },
  consents: {
    title: 'Before you start',
    lead: 'You are going to record how you feel, and that is health data. So we ask for your permission, one item at a time.',
    legend: 'Permissions',
    adult: 'I am 18 or older.',
    documents:
      'I have read and accept the <terms>Terms of use</terms> and the <privacy>Privacy policy</privacy>.',
    health:
      'I allow my mood entries and my questionnaire answers to be processed. This is health data, used only to show my patterns.',
    ai: 'Optional: I want AI to write summaries from my entries.',
    submit: 'Agree and continue',
    saving: 'Saving…',
  },
  name: {
    title: 'What should we call you?',
    lead: 'This is how the app will talk to you. Only you can see it.',
    label: 'Name',
    submit: 'Continue',
    saving: 'Saving…',
  },
  photo: {
    title: 'Would you like to add a photo?',
    lead: 'It’s optional. Only you and the professionals you choose to share your records with will see it.',
    alt: 'Your photo',
    continue: 'Continue',
    skip: 'Continue without a photo',
    later: 'You can change or remove it whenever you like, in You.',
  },
  intro: {
    title: 'Two short questionnaires',
    lead: 'The <nowrap>PHQ-9</nowrap> and the <nowrap>GAD-7</nowrap> are used around the world to follow signs of depression and anxiety. They become your starting point.',
    facts: {
      questions: 'questions, one per screen',
      minutes: 'minutes, more or less',
      weeks: 'weeks: the period the questions cover',
    },
    honesty: 'There are no right answers. Answer thinking about how things really went.',
    disclaimer: 'This is a screening, not a diagnosis.',
    start: 'Start',
  },
  results: {
    title: 'Your starting point.',
    lead: 'The reference for seeing how you change.',
    disclaimer:
      'This is a screening, not a diagnosis. Only a professional can assess your situation.',
    finish: 'Start using the app',
    finishing: 'Getting ready…',
  },
  saveError: 'We could not save right now. Try again in a moment.',
}
