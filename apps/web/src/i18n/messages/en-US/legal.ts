import type { LegalMessages } from '../pt-BR/legal'

export const legal: LegalMessages = {
  draftNotice:
    'Draft version, October 22, 2026. The final text will go through legal review before launch.',
  privacy: {
    title: 'Privacy policy',
    summary:
      'How MyCogniAI handles your data, why it does, and what you can do with it at any time.',
    sections: {
      collected: {
        heading: 'What we collect',
        body: 'Your email, name and photo, if you choose to provide them. Your mood check-ins, emotions, context and notes. Your answers to the PHQ-9, GAD-7 and WHO-5. Your conversations with Cogni and the memories it keeps.',
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
      memories: {
        heading: 'Cogni’s memories',
        body: 'Cogni, the app’s virtual companion, keeps short notes about what you share in your check-in notes, in additions to them, in your conversations with it and, if you let it read MyBook, in your MyBook pages. They are used to personalise your conversations and to notice trends and risk signs, never to make a diagnosis. Memories are on by default and you can turn them off in Privacy and data. In Profile and settings → Memories you can see, edit, add and delete each one or all of them, and they are part of your data export. Deleting a record deletes what was learned only from it. Professionals will only see memories you choose to share.',
      },
      voice: {
        heading: 'Voice messages',
        body: 'If you talk to Cogni by voice, the audio goes to a transcription provider only to turn it into text. We do not store the audio.',
      },
      zenStats: {
        heading: 'Aggregated use of Zen',
        body: 'To improve Zen, we look at aggregated, de-identified numbers, such as how many people finish a meditation and how they feel afterwards. We never look at one person’s sessions, and groups smaller than five people are left out.',
      },
      sharing: {
        heading: 'Who we share it with',
        body: 'Only with the providers that run the service, such as hosting, database, email delivery and, if you turn it on, AI, always under contract and only as far as needed. We never sell your data or use it for advertising.',
      },
      rights: {
        heading: 'Your rights',
        body: 'You can access, correct, export and delete your data, and withdraw consent, right in the app. To export, ask for your data in Privacy and data: we prepare a ZIP file with everything we keep, in a structured format and in easy-to-read copies, with your photos. We let you know by email and in the app when it is ready; the file stays available for 7 days and only you can download it, inside the app. Deleting your account removes all your records and files.',
      },
    },
  },
  update: {
    meta: { title: 'Updated terms' },
    title: 'We updated our terms',
    lead: 'Cogni can now keep memories of what you share, to talk with you better. You can see, edit or delete each one in Profile and settings → Memories and turn them off whenever you want.',
    accept:
      'I have read and accept the <terms>Terms of use</terms> and the <privacy>Privacy policy</privacy>.',
    continue: 'Accept',
    signOut: 'Sign out',
  },
  terms: {
    title: 'Terms of use',
    summary: 'The rules for using MyCogniAI, written to be read.',
    sections: {
      about: {
        heading: 'What MyCogniAI is',
        body: 'A tool for self-knowledge and for screening signs of anxiety and depression. It is not a health service, does not diagnose and does not replace care from a professional.',
      },
      cogni: {
        heading: 'Cogni',
        body: 'Cogni is an AI virtual companion, not a psychologist or a health service. It can keep memories of what you share to talk with you better, as the Privacy policy explains. You control these memories and can turn them off whenever you want.',
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
