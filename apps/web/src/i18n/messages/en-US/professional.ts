import type { ProfessionalMessages } from '../pt-BR/professional'

export const professional: ProfessionalMessages = {
  meta: {
    join: 'For health professionals',
    patients: 'Patients',
    invites: 'Invitations',
    patient: 'Patient file',
  },
  shell: {
    area: 'Professional area',
    navigation: 'Professional area navigation',
    patients: 'Patients',
    invites: 'Invitations',
    diary: 'My journal',
  },
  join: {
    kicker: 'For health professionals',
    title: 'Follow your patients between sessions.',
    lead: 'When a patient accepts your invitation, you see the mood entries and PHQ-9 and GAD-7 results they chose to share, all in one place.',
    offersTitle: 'What you get',
    offers: {
      checkIns: {
        title: 'Day-to-day entries',
        body: 'Mood, emotions, contexts and notes, with the last 30 days of mood in a chart.',
      },
      screenings: {
        title: 'PHQ-9 and GAD-7',
        body: 'The history of each questionnaire with the severity of every result. They show signs; they do not give a diagnosis.',
      },
      consent: {
        title: 'Always with consent',
        body: 'Patients accept each invitation, choose whether to share earlier entries and can end the link at any time.',
      },
    },
    verification:
      'Every professional sign-up is checked by hand by the MyCogniAI team before invitations are enabled.',
    signUp: 'Create my account',
    signIn: 'I already have an account',
  },
  form: {
    title: 'Your professional details',
    lead: 'Once you send them, our team checks your license before enabling invitations.',
    kind: 'Profession',
    fullName: 'Full name',
    fullNameHint: 'This is how your patients will see you.',
    registration: 'License number',
    registrationOptional: 'Professional registration (optional)',
    registrationHints: {
      psychologist: 'E.g. PSY 12345 (CA)',
      psychiatrist: 'E.g. MD 123456 (NY)',
      physician: 'E.g. MD 123456 (NY)',
      psychoanalyst:
        'If you have one, enter the registration from your training institute or association.',
    },
    consent:
      'I am 18 or older and I accept the <terms>terms of use</terms> and the <privacy>privacy policy</privacy>.',
    submit: 'Send for verification',
    sending: 'Sending…',
    errors: {
      kindRequired: 'Choose your profession.',
      fullNameRequired: 'Enter your full name.',
      fullNameTooLong: 'Use 120 characters or fewer.',
      registrationRequired: 'Enter your license number.',
      registrationTooShort: 'Check the number: use at least 3 characters.',
      registrationTooLong: 'Use 40 characters or fewer.',
      consentRequired: 'To continue, accept the terms of use and the privacy policy.',
      save: 'We could not send your details right now. Try again in a moment.',
    },
  },
  status: {
    pending: {
      title: 'Your sign-up is being verified.',
      body: 'Our team checks your professional license by hand before enabling invitations.',
      next: 'What happens next',
      steps: {
        review: 'We check your name and your license.',
        approve: 'Once you are approved, this page shows your patients.',
        invite:
          'You invite patients by email or by link, and each of them decides whether to accept.',
      },
      submitted: 'Sent on {date}.',
    },
    rejected: {
      title: 'We could not verify your sign-up.',
      body: 'If you think this is a mistake or want to send other details, write to <link>{email}</link> with your name and license number.',
    },
  },
  patients: {
    title: 'Patients',
    description: 'People who agreed to share their entries with you.',
    invite: 'Invite a patient',
    emptyTitle: 'No patients yet.',
    emptyBody: 'When someone accepts your invitation, their entries show up here.',
    unnamed: 'Unnamed patient',
    since: 'Since {date}',
    lastCheckIn: 'Last entry',
    noCheckIn: 'No entries yet',
    lastWeek: 'Last 7 days',
    weekCount: '{count, plural, =0 {No entries} one {# entry} other {# entries}}',
    notAnswered: 'Not answered',
    ago: '{days, plural, =0 {today} =1 {yesterday} other {# days ago}}',
  },
  risk: {
    label: 'Note PHQ-9 item 9',
    short: 'Item 9 positive',
    detail:
      'On the PHQ-9 from {date}, item 9, about thoughts of death or self-harm, was answered positively.',
  },
  patient: {
    back: 'Patients',
    kicker: 'Patient file',
    since: 'Sharing entries with you since {date}.',
    fromLink: 'You see entries made since the link started.',
    withHistory: 'Includes entries from before the link, which the patient chose to share.',
    mood: {
      title: 'Mood over the last {days} days',
      label:
        '{count, plural, one {# day with entries} other {# days with entries}} in the last {days} days',
      emptyLabel: 'No entries in the last {days} days',
      empty: 'No mood entries in the last {days} days.',
    },
    trend: {
      recent: 'Average mood over the last 7 days: {mood} ({average} of {max}).',
      up: 'Higher than the 7 days before ({previous}).',
      down: 'Lower than the 7 days before ({previous}).',
      steady: 'Similar to the 7 days before ({previous}).',
    },
    screenings: {
      title: 'Questionnaires',
      empty: 'No questionnaires answered in the shared period.',
      score: '{score} of {max}',
      note: 'Questionnaires show how intense the signs are. They do not give a diagnosis.',
    },
    entries: {
      title: 'Entries from the last {days} days',
      empty: 'No entries in the last {days} days.',
    },
  },
  invites: {
    title: 'Invitations',
    description:
      'Invite patients by email or by link. Each invitation is valid for {hours} hours and only creates a link if the person accepts.',
    form: {
      title: 'New invitation',
      channel: 'How to send it',
      email: 'By email',
      link: 'By link',
      recipient: 'Patient email',
      recipientHint: 'The email is written in the language you use the app in.',
      linkHint: 'You get a link to send by WhatsApp, text message or however you prefer.',
      sendEmail: 'Send invitation',
      createLink: 'Create link',
      sending: 'Creating…',
      invalidEmail: 'Enter a valid email.',
      error: 'We could not create the invitation right now. Try again in a moment.',
    },
    result: {
      emailSent: 'Invitation sent to {email}.',
      emailNotSent:
        'We could not send the email right now. Copy the link and send it to {email} however you prefer.',
      link: 'Link created. Copy it and send it to the person however you prefer.',
      validity: 'Valid until {date}.',
    },
    link: 'Invitation link',
    copy: 'Copy link',
    copied: 'Link copied',
    copyFailed: 'Could not copy. Select the link and copy it.',
    sent: {
      title: 'Sent invitations',
      empty: 'No invitations sent yet.',
      byLink: 'Invitation by link',
      created: 'Created {date}',
      expires: 'Valid until {date}',
      expired: 'Expired {date}',
      responded: 'Answered {date}',
      resend: 'Send again',
      renew: 'Create a new link',
      cancel: 'Cancel invitation',
      resent: 'Invitation sent again to {email}.',
      resentNotSent:
        'We created a new invitation, but the email was not sent. Copy the new link and send it to {email}.',
      renewed: 'New link created. Copy it and send it to the person.',
      canceled: 'Invitation canceled.',
      error: 'We could not do that right now. Try again in a moment.',
    },
    statuses: {
      pending: 'Waiting for an answer',
      accepted: 'Accepted',
      declined: 'Declined',
      canceled: 'Canceled',
      expired: 'Expired',
    },
  },
}
