import type { MemoriesMessages } from '../pt-BR/memories'

export const memories: MemoriesMessages = {
  meta: { title: 'Memories' },
  lead: 'What Cogni remembers from what you share, to talk with you better.',
  switch: {
    label: 'Remember what I share',
    hint: {
      on: 'On, Cogni learns from what you write.',
      off: 'Off, Cogni keeps nothing new.',
    },
  },
  add: {
    open: 'Add a memory',
    label: 'New memory',
    placeholder: 'E.g. Walking helps me slow down.',
    save: 'Save',
    cancel: 'Cancel',
  },
  empty: 'Nothing kept yet.',
  source: {
    manual: 'Added by you',
    conversation: 'From a conversation',
    checkIn: 'From a record on {date}',
    journal: 'From MyBook',
  },
  item: {
    edit: 'Edit',
    remove: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    label: 'Memory',
  },
  saved: 'Saved memories',
  archived: 'Older memories',
  clear: {
    open: 'Delete all',
    title: 'Delete all memories?',
    body: 'Cogni forgets everything it kept. This can’t be undone.',
    confirm: 'Delete all',
    cancel: 'Cancel',
  },
  feedback: {
    added: 'Memory saved.',
    updated: 'Memory updated.',
    removed: 'Memory deleted.',
    cleared: 'Memories deleted.',
    on: 'Cogni remembers what you share again.',
    off: 'Cogni won’t keep anything new.',
    tooLong: 'Use up to {max} characters.',
    empty: 'Write the memory.',
    error: 'We couldn’t save right now. Try again in a moment.',
  },
}
