import type { TrackTexts } from '../types.ts'

export const englishTracks: TrackTexts = {
  'everyday-anxiety': {
    title: 'Everyday anxiety',
    summary:
      'Understand what anxiety does to the body and mind, and practise two simple tools for days when worry takes over.',
    steps: {
      'read-anxiety-basics': {
        title: 'Read: what anxiety is, and what it is not',
        body: 'A short piece on the difference between everyday anxiety and a pattern that calls for help.',
      },
      breathe: {
        title: 'Box breathing',
        body: 'Four rounds of 4-4-4-4 breathing, about a minute. Sit down and take your time.',
      },
      'read-worry-time': {
        title: 'Read: worry time',
        body: 'How to give your worries a set time and take the rest of the day back.',
      },
      'write-worry': {
        title: 'Write in MyBook',
        body: 'Which worry came back most often this week? What can you do about it, and what is outside your control?',
      },
      'check-in': {
        title: 'Check in',
        body: 'Record your mood after practising. Over time you can see what helps.',
      },
      reflect: {
        title: 'Reflect',
        body: 'When you postponed a worry to its set time, did it arrive with the same force? What changed?',
      },
    },
  },
  'performance-anxiety': {
    title: 'Performance anxiety',
    summary:
      'For exams, presentations, interviews and reviews at work: understand the nerves beforehand and prepare without avoiding the situation.',
    steps: {
      'read-performance-anxiety': {
        title: 'Read: performance anxiety',
        body: 'Why the body speeds up before being evaluated, and what tends to help.',
      },
      'read-breathing': {
        title: 'Read: slow breathing and coming back to the present',
        body: 'What is known, and what is not yet known, about slow breathing and grounding.',
      },
      breathe: {
        title: 'Box breathing',
        body: 'Practise now, calmly, so the technique is at hand on the day.',
      },
      'write-prediction': {
        title: 'Write in MyBook',
        body: 'Think of the next situation in which you will be evaluated. What are you afraid will happen? And what is most likely to happen?',
      },
      reflect: {
        title: 'Reflect afterwards',
        body: 'After the situation, compare what actually happened with what you predicted.',
      },
      'check-in': {
        title: 'Check in',
        body: 'Record your mood on the day of the situation to see how you handled it.',
      },
    },
  },
  'low-mood': {
    title: 'Low mood',
    summary:
      'When motivation is missing and well-being is low: small planned actions, one at a time, and attention to what changes in your mood.',
    steps: {
      'read-behavioural-activation': {
        title: 'Read: acting before you feel like it',
        body: 'What behavioural activation is and why small planned activities help mood.',
      },
      'write-activities': {
        title: 'Write in MyBook',
        body: 'List three small activities that used to do you good or that matter to you. Which one could you do tomorrow, and at what time?',
      },
      'check-in': {
        title: 'Check in',
        body: 'After the activity, record your mood. It does not have to have gone well; it is worth noting how it went.',
      },
      reflect: {
        title: 'Reflect',
        body: 'How was your mood before and after the activity? Was there any difference, however small?',
      },
      questionnaires: {
        title: 'Follow up with the questionnaires',
        body: 'Answer the PHQ-9 and GAD-7 every two weeks to see how you change. It is a screening, not a diagnosis.',
      },
    },
  },
  'sleep-and-rest': {
    title: 'Sleep and rest',
    summary:
      'Sleep and mood move together. Notice your nights, adjust your routine with small changes and keep worries out of bed.',
    steps: {
      'read-sleep-and-mood': {
        title: 'Read: sleep and mood',
        body: 'How sleep affects mood and which habits have the most evidence.',
      },
      'write-nights': {
        title: 'Write in MyBook',
        body: 'How were your last three nights? Note when you went to bed, when you woke up and what you did in the last hour before sleep.',
      },
      breathe: {
        title: 'Breathe before bed',
        body: 'A few rounds of box breathing to slow down before turning off the light.',
      },
      'read-worry-time': {
        title: 'Read: worry time',
        body: 'A way to keep worries out of bed.',
      },
      reflect: {
        title: 'Reflect',
        body: 'Which small change to your sleep routine could you keep for a week?',
      },
    },
  },
  'seeking-help': {
    title: 'When to seek help',
    summary:
      'Signs that it is time to see a professional, where to find help right now and how to prepare for that conversation. This track does not replace care.',
    steps: {
      'read-when-to-seek-help': {
        title: 'Read: when to seek help',
        body: 'Signs of intense anxiety, depression and strong mood changes that call for a professional assessment.',
      },
      support: {
        title: 'Know who to contact',
        body: 'If you are in danger or thinking about hurting yourself, call now. You do not have to go through this without help.',
      },
      'read-screening-not-diagnosis': {
        title: 'Read: screening is not diagnosis',
        body: 'What the questionnaires in the app show, and what only a professional assessment can tell you.',
      },
      'write-for-professional': {
        title: 'Write in MyBook',
        body: 'What would you like to tell a professional? What you have been feeling, since when, what makes it worse and what helps.',
      },
    },
  },
}
