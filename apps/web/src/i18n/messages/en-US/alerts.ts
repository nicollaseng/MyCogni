import type { AlertsMessages } from '../pt-BR/alerts'

export const alerts: AlertsMessages = {
  meta: { title: 'Alerts' },
  title: 'Alerts',
  description:
    'Situations that call for a look from you: answers that suggest risk, severe results, worsening mood, summaries that ask for attention and days without entries. Urgent ones also arrive by email, with no clinical details.',
  levels: { urgent: 'Urgent', watch: 'Watch', info: 'Info' },
  statuses: { open: 'New', acknowledged: 'Seen', resolved: 'Resolved' },
  reasons: {
    risk_item: 'PHQ-9 item 9 positive',
    summary_urgent: 'Weekly summary asks for urgent attention',
    severe_screening: 'Severe questionnaire result',
    summary_watch: 'Weekly summary suggests a closer look',
    low_mood: 'Low mood this week',
    mood_drop: 'Mood drop this week',
    inactive: 'No entries for 7+ days',
  },
  search: 'Search alerts',
  searchPlaceholder: 'Search by patient',
  levelFilter: 'Filter by level',
  statusFilter: 'Filter by status',
  levelFilters: { all: 'All levels', urgent: 'Urgent', watch: 'Watch', info: 'Info' },
  statusFilters: {
    pending: 'Pending',
    open: 'New',
    acknowledged: 'Seen',
    resolved: 'Resolved',
    all: 'All',
  },
  columns: {
    patient: 'Patient',
    reason: 'Reason',
    level: 'Level',
    createdAt: 'When',
    status: 'Status',
    actions: 'Actions',
  },
  results: '{count, plural, =0 {No alerts} one {# alert} other {# alerts}}',
  empty: 'No alerts yet. When something needs your attention, it shows up in this list.',
  noResults: 'No alerts match the filters.',
  clear: 'Clear filters',
  unnamed: 'Unnamed patient',
  acknowledge: 'Mark as seen',
  resolve: 'Resolve',
  acknowledgeLabel: 'Mark as seen: {reason}, {name}',
  resolveLabel: 'Resolve: {reason}, {name}',
  acknowledged: 'Alert marked as seen.',
  resolved: 'Alert resolved.',
  error: 'We could not update the alert right now. Please try again in a moment.',
  resolvedAt: 'Resolved on {date}',
  navigation: {
    pending:
      '{count, plural, =0 {no pending alerts} one {# pending alert} other {# pending alerts}}',
  },
  kpis: {
    label: 'Pending alerts',
    urgent: '{count, plural, =0 {None urgent} other {# urgent}}',
    calm: 'No pending alerts',
  },
  overview: {
    title: 'Pending alerts',
    seeAll: 'See all alerts ({count})',
    empty: 'No pending alerts right now.',
  },
  patient: {
    title: 'Pending alerts',
    description:
      'Once resolved, the alert leaves this list. If the situation comes back, a new alert is opened.',
    all: 'See all alerts',
  },
}
