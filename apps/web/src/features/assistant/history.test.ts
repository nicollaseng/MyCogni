import { describe, expect, it } from '@jest/globals'
import type { AssistantConversationSummary } from '@mycogni/contracts'
import { conversationTitle, groupConversations } from './history'

function conversation(id: string, updatedAt: string): AssistantConversationSummary {
  return {
    id,
    mode: 'personal',
    risk: 'none',
    preview: `Conversa ${id}`,
    entryId: null,
    createdAt: updatedAt,
    updatedAt,
  }
}

describe('conversationTitle', () => {
  it('keeps short questions whole', () => {
    expect(conversationTitle('Como dormi?')).toBe('Como dormi?')
    expect(conversationTitle('  Como   dormi?  ')).toBe('Como dormi?')
  })

  it('cuts long questions at a word boundary near 40 characters', () => {
    expect(conversationTitle('Como foi minha semana de trabalho e de sono nos últimos dias?')).toBe(
      'Como foi minha semana de trabalho e de…',
    )
    expect(conversationTitle('Tenho dormido mal, o que posso tentar esta semana?')).toBe(
      'Tenho dormido mal, o que posso tentar…',
    )
  })

  it('cuts a very long word without spaces at 40 characters', () => {
    expect(conversationTitle('a'.repeat(60))).toBe(`${'a'.repeat(40)}…`)
  })

  it('has no title for an empty conversation', () => {
    expect(conversationTitle('   ')).toBeNull()
  })
})

describe('groupConversations', () => {
  const now = new Date('2026-10-22T15:00:00Z')
  const timeZone = 'America/Sao_Paulo'

  it('groups by today, yesterday, this week and older, newest first', () => {
    const grouped = groupConversations(
      [
        conversation('older', '2026-10-10T12:00:00Z'),
        conversation('morning', '2026-10-22T11:00:00Z'),
        conversation('yesterday', '2026-10-21T20:00:00Z'),
        conversation('afternoon', '2026-10-22T14:00:00Z'),
        conversation('monday', '2026-10-19T12:00:00Z'),
        conversation('late-night', '2026-10-22T02:30:00Z'),
      ],
      now,
      timeZone,
    )

    expect(
      grouped.map(({ group, conversations }) => [group, conversations.map((item) => item.id)]),
    ).toEqual([
      ['today', ['afternoon', 'morning']],
      ['yesterday', ['late-night', 'yesterday']],
      ['week', ['monday']],
      ['older', ['older']],
    ])
  })

  it('leaves out empty groups', () => {
    expect(groupConversations([], now, timeZone)).toEqual([])
  })
})
