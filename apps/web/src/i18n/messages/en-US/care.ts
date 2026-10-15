import type { CareMessages } from '../pt-BR/care'

export const care: CareMessages = {
  invite: {
    meta: { title: 'Invitation' },
    kicker: 'Invitation',
    pending: {
      title: '{name} would like to follow your entries.',
      lead: 'Once you are linked, {name} can see how you have been feeling between sessions. You decide whether earlier entries are included, and you can end the link at any time.',
      expiresInDays:
        'This invitation is valid for {count, plural, one {# more day} other {# more days}}.',
      expiresInHours:
        'This invitation is valid for {count, plural, one {# more hour} other {# more hours}}.',
      signUp: 'Create an account to respond',
      signIn: 'I already have an account',
      signedOutHint: 'First create your account or sign in. Then decide whether to accept.',
      open: 'View the invitation',
      opening: 'Opening…',
    },
    closed: {
      expired: {
        title: 'This invitation has expired.',
        body: 'Invitations are valid for 72 hours. If you still want to link, ask {name} for a new one.',
      },
      accepted: {
        title: 'This invitation has already been accepted.',
        body: 'The professionals who follow your entries are listed in Profile and settings, under Professionals.',
      },
      declined: {
        title: 'This invitation was declined.',
        body: 'If you have changed your mind, ask {name} for a new invitation.',
      },
      canceled: {
        title: '{name} canceled this invitation.',
        body: 'If you still want to link, ask for a new invitation.',
      },
    },
    unknown: {
      title: 'We couldn’t find this invitation.',
      body: 'Check that the link is complete, or ask the sender for a new one.',
    },
    goToApp: 'Go to MyCogniAI',
    goHome: 'Discover MyCogniAI',
  },
  sharing: {
    sharedTitle: 'What {name} will see',
    shared: {
      checkIns: 'Your mood entries, with emotions, contexts and notes',
      screenings: 'Your PHQ-9 and GAD-7 results',
    },
    privateTitle: 'What stays just with you',
    private: {
      account: 'Your email, password and account settings',
      others: 'Your links with other professionals',
    },
  },
  accept: {
    meta: { title: 'Invitation' },
    kicker: 'Invitation',
    title: '{name} would like to follow your entries.',
    registration: '{registration}',
    history: {
      label: 'Also share my earlier entries',
      off: '{name} will only see what you record from today on.',
      on: '{name} will also see everything you recorded before today.',
    },
    terms: {
      title: 'Sharing terms',
      version: 'Version {version}',
      purpose:
        'By accepting, you allow {name} to see your mood entries, with emotions, contexts and notes, and your PHQ-9 and GAD-7 results, to follow how you are doing.',
      history:
        'By default, only entries made from today on are included. Earlier ones are included only if you turn on the option above.',
      end: 'You can end the link at any time, in Profile and settings. From then on, {name} can no longer see your entries.',
      privacy:
        'The link gives no access to anything else in your account. Learn more in the <link>privacy policy</link>.',
      agreement: 'Accepting means you agree to these terms.',
      confirmAgreement: 'Confirming means you agree to these terms.',
    },
    submit: 'Accept',
    accepting: 'Accepting…',
    decline: 'Decline',
    declining: 'Declining…',
    later: 'Decide later',
    closed: {
      accepted: 'You accepted this invitation on {date}.',
      declined: 'You declined this invitation on {date}.',
      canceled: '{name} canceled this invitation on {date}.',
      expired:
        'This invitation expired on {date}. If you still want to link, ask {name} for a new one.',
    },
    seeProfessionals: 'See your professionals',
    back: 'Back to invitations',
  },
  invites: {
    meta: { title: 'Invitations' },
    title: 'Invitations',
    description: 'Invitations from professionals to follow your entries.',
    empty:
      'You haven’t received any invitations yet. When a professional invites you, the invitation shows up here and in your notifications.',
    groups: {
      pending: 'Waiting for your answer',
      accepted: 'Accepted',
      declined: 'Declined',
      canceled: 'Canceled',
      expired: 'Expired',
    },
    dates: {
      pending: 'Received on {date}',
      accepted: 'Accepted on {date}',
      declined: 'Declined on {date}',
      canceled: 'Canceled on {date}',
      expired: 'Expired on {date}',
    },
    respond: 'Respond',
  },
  notifications: {
    meta: { title: 'Notifications' },
    title: 'Notifications',
    empty: 'Nothing here yet.',
    new: 'New',
    invitation: '{name} sent you an invitation to follow your entries.',
    invitationStatus: {
      pending: 'Waiting for your answer',
      accepted: 'You accepted',
      declined: 'You declined',
      canceled: 'Invitation canceled',
      expired: 'Invitation expired',
    },
    open: {
      invitation: 'View invitation',
      professional: 'View professionals',
      insight: 'View summary',
    },
    kinds: {
      invitation: 'An invitation from a professional',
      professional: 'A message from a professional',
      marketing: 'News from MyCogniAI',
      system: 'A notice from MyCogniAI',
      insight: 'Your weekly summary is ready.',
    },
  },
  bell: {
    label:
      '{count, plural, =0 {Notifications} one {Notifications, # unread} other {Notifications, # unread}}',
    unread: '{count} unread',
    seeAll: 'See all',
  },
  links: {
    title: 'Professionals',
    empty: 'No professional follows your entries.',
    since: 'Since {date}',
    history: {
      shared: 'Includes earlier entries',
      fromStart: 'Only entries since the link',
    },
    end: {
      open: 'End link',
      warning:
        '{name} will stop seeing your entries from now on. To link again, you will need a new invitation.',
      confirm: 'End link',
      ending: 'Ending…',
      cancel: 'Cancel',
    },
    invites: 'See invitations',
    professionalArea: 'Professional area',
  },
  terms: {
    meta: { title: 'Updated terms' },
    kicker: 'Updated terms',
    title: 'Review and confirm the new terms.',
    lead: 'Until you confirm, {name} keeps seeing your entries as you accepted before. If you prefer, you can end the link.',
    changes: {
      title: 'What changed',
      body: 'Only the name of the place where you end the link: it is now Profile and settings. Everything else stays the same.',
    },
    confirm: 'Confirm',
    confirming: 'Confirming…',
    notice: 'We updated the sharing terms. <link>Review and confirm</link>.',
    status: 'Confirm the new terms',
  },
  feedback: {
    unavailable: 'This invitation is no longer available. Ask the sender for a new one.',
    notPending: 'This invitation has already been answered or is no longer valid.',
    alreadyLinked: 'You already share your entries with {name}.',
    error: 'We couldn’t finish that right now. Please try again in a moment.',
    endError: 'We couldn’t end the link right now. Please try again in a moment.',
    linkEnded: 'This link has already ended.',
    termsError: 'We couldn’t confirm the terms right now. Please try again in a moment.',
  },
}
