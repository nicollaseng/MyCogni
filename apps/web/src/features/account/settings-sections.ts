export const settingsSections = [
  'profile',
  'wellbeing',
  'professionals',
  'reminders',
  'sound',
  'memories',
  'privacy',
  'account',
  'support',
] as const

export type SettingsSection = (typeof settingsSections)[number]

export type SettingsHref = `/me/${SettingsSection}`

export const settingsGroups: readonly (readonly SettingsSection[])[] = [
  ['profile'],
  ['wellbeing', 'professionals'],
  ['reminders', 'sound'],
  ['memories', 'privacy'],
  ['account', 'support'],
]

const legacyAnchors: Readonly<Record<string, SettingsSection>> = {
  '#professionals': 'professionals',
  '#support': 'support',
  '#privacy': 'privacy',
  '#sound': 'sound',
  '#questionnaires': 'wellbeing',
}

export function settingsHref(section: SettingsSection): SettingsHref {
  return `/me/${section}`
}

export function isSettingsSection(value: string | null): value is SettingsSection {
  return settingsSections.some((section) => section === value)
}

export function activeSection(segment: string | null): SettingsSection | null {
  if (segment === null) {
    return 'profile'
  }
  return isSettingsSection(segment) ? segment : null
}

export function legacyAnchorHref(hash: string): SettingsHref | null {
  const section = Object.hasOwn(legacyAnchors, hash) ? legacyAnchors[hash] : undefined
  return section === undefined ? null : settingsHref(section)
}
