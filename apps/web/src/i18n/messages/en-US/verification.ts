import type { VerificationMessages } from '../pt-BR/verification'

export const verification: VerificationMessages = {
  steps: {
    title: 'Professional sign-up',
    progress: 'Step {current} of {total}',
    back: 'Back to sign-up',
    done: 'done',
    names: {
      document: 'Proof of license',
      photo: 'Profile photo',
      review: 'In review',
    },
    hints: {
      photo: 'Optional. Shown to your patients.',
      review: 'The MyCogniAI team checks everything before enabling invitations.',
    },
  },
  start: {
    title: 'Send proof of your license.',
    lead: 'We check every professional before enabling invitations. Your sign-up goes to review as soon as the document arrives.',
  },
  photo: {
    title: 'Add a photo to your profile.',
    lead: 'It is optional. The photo appears next to your name on your invitation page and to the patients you follow.',
    received: 'Document received. The review has started.',
    add: 'Add photo',
    skip: 'Skip for now',
    continue: 'Continue',
    saving: 'Saving…',
    later: 'You can change or remove the photo anytime in Settings.',
    failed: 'We couldn’t continue right now. Please try again in a moment.',
  },
  review: {
    settings: 'To change the photo or the document, open <link>Settings</link>.',
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
    drop: 'or drag the file here',
    formats: 'PDF, JPG or PNG, up to 10 MB.',
    replace: 'Replace',
    remove: 'Remove',
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
