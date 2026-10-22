import { describe, expect, it } from '@jest/globals'
import {
  activeSection,
  isSettingsSection,
  legacyAnchorHref,
  settingsGroups,
  settingsHref,
  settingsSections,
} from './settings-sections'

describe('settings sections', () => {
  it('gives every section its own route and puts each one in a group once', () => {
    expect(settingsSections.map(settingsHref)).toEqual([
      '/me/profile',
      '/me/wellbeing',
      '/me/professionals',
      '/me/reminders',
      '/me/sound',
      '/me/memories',
      '/me/privacy',
      '/me/account',
      '/me/support',
    ])
    expect(settingsGroups.flat()).toEqual([...settingsSections])
  })

  it('marks the profile as active on the settings home and ignores other segments', () => {
    expect(activeSection(null)).toBe('profile')
    expect(activeSection('privacy')).toBe('privacy')
    expect(activeSection('export')).toBeNull()
    expect(isSettingsSection('sound')).toBe(true)
    expect(isSettingsSection(null)).toBe(false)
  })

  it('sends the old anchors of the single page to the new routes', () => {
    expect(legacyAnchorHref('#professionals')).toBe('/me/professionals')
    expect(legacyAnchorHref('#support')).toBe('/me/support')
    expect(legacyAnchorHref('#questionnaires')).toBe('/me/wellbeing')
    expect(legacyAnchorHref('')).toBeNull()
    expect(legacyAnchorHref('#toString')).toBeNull()
  })
})
