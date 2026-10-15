import type { LegalMessages } from '../pt-BR/legal'

export const legal: LegalMessages = {
  draftNotice:
    'Draft version, October 2026. The final text will go through legal review before launch.',
  privacy: {
    title: 'Privacy policy',
    summary:
      'How MyCogniAI handles your data, why it does, and what you can do with it at any time.',
    sections: {
      collected: {
        heading: 'What we collect',
        body: 'Your email, name and photo, if you choose to provide them. Your mood check-ins, emotions, context and notes. Your answers to the PHQ-9, GAD-7 and WHO-5.',
      },
      purpose: {
        heading: 'Why we collect it',
        body: 'To show your check-ins, calculate the patterns in your days and, if you turn it on, generate summaries written by AI. Nothing beyond that.',
      },
      legalBasis: {
        heading: 'Legal basis',
        body: 'Mood check-ins and questionnaire answers are sensitive personal health data under Article 11 of the LGPD (Brazil’s General Personal Data Protection Law). We process this data with your specific consent, which you can withdraw whenever you want.',
      },
      ai: {
        heading: 'Artificial intelligence',
        body: 'Summaries are written from statistics calculated on your check-ins, without your name or email. AI is optional and can be turned off at any time. Your data is not used to train models.',
      },
      sharing: {
        heading: 'Who we share it with',
        body: 'Only with the providers that run the service, such as hosting, database, email delivery and, if you turn it on, AI, always under contract and only as far as needed. We never sell your data or use it for advertising.',
      },
      rights: {
        heading: 'Your rights',
        body: 'You can access, correct, export and delete your data, and withdraw consent, right in the app. Deleting your account removes all your check-ins.',
      },
    },
  },
  terms: {
    title: 'Terms of use',
    summary: 'The rules for using MyCogniAI, written to be read.',
    sections: {
      about: {
        heading: 'What MyCogniAI is',
        body: 'A tool for self-knowledge and for screening signs of anxiety and depression. It is not a health service, does not diagnose and does not replace care from a professional.',
      },
      crisis: {
        heading: 'In a crisis',
        body: 'MyCogniAI is not an emergency service. If you are in crisis or thinking about hurting yourself, call or text 988 or call 911.',
      },
      account: {
        heading: 'Your account',
        body: 'You must be 18 or older to use the service. You are responsible for keeping access to your account secure.',
      },
      acceptableUse: {
        heading: 'Acceptable use',
        body: 'Do not use the service to harm other people, try to access data that is not yours or interfere with how the system works.',
      },
      changes: {
        heading: 'Changes',
        body: 'If these terms change in a meaningful way, you will be notified before the change takes effect.',
      },
    },
  },
}
