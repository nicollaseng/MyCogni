import type { LandingMessages } from '../pt-BR/landing'

export const landing: LandingMessages = {
  sections: {
    label: 'Sections',
    howItWorks: 'How it works',
    ai: 'Artificial intelligence',
    privacy: 'Privacy',
    faq: 'Questions',
  },
  cta: {
    start: 'Get started',
    signIn: 'Sign in',
    signUp: 'Create account',
  },
  hero: {
    label: 'Try it',
    kicker: 'Mood journal',
    question: 'How are you feeling right now?',
    intro:
      'Drag and watch the map respond. A check-in takes less than a minute, and every two weeks a few questions about mood and anxiety show how you change over time.',
  },
  howItWorks: {
    title: 'A minute a day, a snapshot every two weeks.',
    steps: {
      record: {
        title: 'Check in',
        description:
          'Slide to your mood right now and, if you like, add what you feel and what it relates to. It takes less than a minute.',
      },
      answer: {
        title: 'Answer',
        description:
          'Every two weeks, short questions about mood and anxiety, used around the world.',
      },
      understand: {
        title: 'Understand',
        description:
          'Every week, a plain-language summary shows what changed and what seems to shape your days.',
      },
    },
    sample: {
      label: 'Example of two weeks of mood',
      caption: 'example · 14 days',
    },
    questionnaire: {
      caption: 'Feeling down · question 2 of 9',
      question:
        'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?',
    },
  },
  ai: {
    title: 'The AI writes. The numbers come from you.',
    description:
      'Every week, MyCogniAI finds patterns in your check-ins and writes a plain-language summary, so you can understand your days and bring it to therapy.',
    principles: {
      statistics:
        'The patterns come from statistics run on your check-ins. The AI only writes about them.',
      noDiagnosis: 'It does not diagnose and does not talk about medication.',
      crisis: 'If a sign of risk appears, it shows human help right away: call or text 988.',
      optional: 'It is optional. Turn it on and off whenever you want.',
    },
  },
  weeklyNote: {
    caption: 'weekly summary · October 5–11',
    summary:
      'It was a lighter week than the one before. On the five days you slept seven hours or more, your mood stayed between neutral and good. The two hardest days came after short nights, and on both you noted tiredness and work.',
    table: 'Mood and hours of sleep for each day of the week',
    measure: 'Measure',
    mood: 'mood',
    sleep: 'sleep',
    hours: '{hours, number} h',
    days: {
      mon: 'Mon',
      tue: 'Tue',
      wed: 'Wed',
      thu: 'Thu',
      fri: 'Fri',
      sat: 'Sat',
      sun: 'Sun',
    },
    footnote:
      'Written by MyCogniAI from 7 check-ins. The connections come from your data; the AI only puts them into words.',
  },
  privacy: {
    title: 'Your data is yours.',
    description:
      'Tracking your mood is one of the most personal things anyone does. MyCogniAI was designed around that.',
    commitments: {
      sensitive:
        'Your check-ins are health data and are treated as sensitive, as the LGPD, Brazil’s data protection law, requires.',
      onlyYou: 'Only you can see your check-ins.',
      control:
        'Export everything or delete your account whenever you want. Deleting means deleting.',
      noSelling: 'Nothing is sold, nothing becomes an ad, nothing trains AI models.',
    },
  },
  faq: {
    title: 'What people ask.',
    questions: {
      therapy: {
        question: 'Does MyCogniAI replace therapy?',
        answer:
          'No. It helps you keep track of how you are doing and arrive at appointments with data. Diagnosis and treatment are for health professionals.',
      },
      instruments: {
        question: 'What are these questions?',
        answer:
          'They are short, validated questionnaires used in the US and around the world to follow signs of low mood and anxiety. They show intensity; they do not give a diagnosis. If you want to look them up, they are the PHQ-9 and GAD-7.',
      },
      ai: {
        question: 'How does the AI use my data?',
        answer:
          'The patterns are calculated with statistics on your check-ins. The AI receives only those results, without your name or email, and writes a summary in plain language.',
      },
      selling: {
        question: 'Is my data sold or used to train AI?',
        answer: 'No. Your check-ins are not sold, do not become ads and do not train models.',
      },
      crisis: {
        question: 'What if I am in crisis?',
        answer:
          'Call or text 988, the Suicide & Crisis Lifeline, free and open 24/7, or call 911 in an emergency. The "Need help right now?" link is on every screen of the app.',
      },
      deletion: {
        question: 'Can I delete everything?',
        answer:
          'Yes. You can export your data or delete your account at any time, and everything is removed.',
      },
      devices: {
        question: 'Does it work on my phone?',
        answer: 'Yes. It works in the browser on your phone and on your computer.',
      },
    },
  },
  closing: {
    title: 'Start with today.',
    lead: 'It takes less than a minute.',
  },
  footer: {
    tagline:
      'A mood journal with questions about mood and anxiety and weekly summaries written by AI.',
    product: 'Product',
    help: 'Help now',
    legal: 'Legal',
    copyright: '© {year} MyCogniAI. Made in Brazil.',
    disclaimer: 'Not therapy or a diagnosis. In a crisis, call or text 988.',
    professionals: 'For health professionals',
  },
}
