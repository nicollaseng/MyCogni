import type { VerificationMessages } from '../pt-BR/verification'

export const verification: VerificationMessages = {
  start: {
    kicker: 'Last step of your sign-up',
    title: 'Send proof of your license.',
    lead: 'We check every professional before enabling invitations. Your sign-up goes to review as soon as the document arrives.',
    photo: 'Profile photo',
    photoHint: 'Optional. Shown to your patients and on your invitation page.',
  },
  proofs: {
    crp: {
      title: 'Psychology license card',
      hint: 'A photo or PDF of your professional ID from the psychology council, with your name and number readable.',
    },
    crm: {
      title: 'Medical license card',
      hint: 'A photo or PDF of your medical council card, with your name and number readable.',
    },
    institution: {
      title: 'Proof of training',
      hint: 'A certificate or letter from your psychoanalytic institution confirming your training or membership, with your name.',
    },
  },
  upload: {
    choose: 'Choose file',
    another: 'Choose another file',
    formats: 'PDF, JPG or PNG, up to 10 MB.',
    send: 'Send document',
    sending: 'Sending…',
    sent: 'Document sent. We will check it soon.',
    consent:
      'We use this document only to verify your license. Only the MyCogniAI team can see it, and it is deleted whenever you ask.',
    errors: {
      type: 'Use a PDF, JPG or PNG file.',
      size: 'The file must be 10 MB or less.',
      failed: 'We couldn’t send the document right now. Please try again in a moment.',
    },
  },
  document: {
    title: 'Proof of license',
    sentAt: 'Sent on {date}',
    status: {
      pending: 'In review',
      verified: 'Approved',
      rejected: 'Rejected',
      missing: 'Not sent',
    },
    resend: 'Send a new document',
    locked:
      'Your license is already verified. To replace the document, write to <link>{email}</link>.',
  },
}
