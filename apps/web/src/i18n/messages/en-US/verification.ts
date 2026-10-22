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
      photo: 'Required. The team compares it with your document.',
      review: 'The MyCogniAI team checks everything before enabling invitations.',
    },
  },
  start: {
    title: 'Send proof of your license.',
    lead: 'We check every professional before enabling invitations. Your sign-up goes to review as soon as the document arrives.',
  },
  photo: {
    title: 'Add a photo of your face.',
    lead: 'The photo is required: our team compares your face with the one on your document before approving. It also appears to your patients next to your name.',
    received: 'Document received. The review has started.',
    add: 'Add photo',
    tips: 'Use a recent photo, facing the camera, in good light, with your whole face visible.',
    continue: 'Continue',
    saving: 'Saving…',
    later: 'After verification, your name and photo only change through support.',
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
